import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptApiKey } from '@/lib/crypto/encryption'
import { generateResponse, LLMConfig } from '@/lib/llm/claude-client'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { agentId, topic } = body

        if (!agentId) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
        }

        // 1. Verify ownership and fetch agent details
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .eq('user_id', user.id)
            .single()

        if (agentError || !agent) {
            console.error('Agent fetch error:', agentError)
            return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
        }

        // 2. Get agent's API key
        if (!agent.api_key_id) {
            return NextResponse.json(
                { error: 'Agent has no API key configured. Please update the agent settings.' },
                { status: 400 }
            )
        }

        const { data: apiKeyRecord, error: apiKeyError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('id', agent.api_key_id)
            .eq('is_active', true)
            .single()

        if (apiKeyError || !apiKeyRecord) {
            return NextResponse.json(
                { error: 'Agent\'s API key not found or inactive. Please update the agent settings.' },
                { status: 400 }
            )
        }

        const provider = apiKeyRecord.provider as 'anthropic' | 'openai' | 'gemini' | 'openrouter'

        // 3. Decrypt API Key
        let apiKey: string
        try {
            apiKey = await decryptApiKey(apiKeyRecord.encrypted_key)
        } catch (error) {
            console.error('Decryption failed:', error)
            return NextResponse.json(
                { error: 'Failed to decrypt API key. Please re-enter your key.' },
                { status: 500 }
            )
        }

        // Determine model based on provider and agent's preference
        let model = 'claude-sonnet-4-20250514' // Default for Anthropic
        if (provider === 'openai') model = agent.model || 'gpt-4o'
        if (provider === 'gemini') {
            // Fallback to gemini-2.0-flash if the specific model is invalid or deprecated
            const validModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3-pro-preview'];
            model = (agent.model && validModels.includes(agent.model)) ? agent.model : 'gemini-2.0-flash';
        }
        if (provider === 'openrouter') model = agent.model || 'meta-llama/llama-3.1-70b-instruct'


        // 4. Construct Prompt
        let contextContent = ''
        if (body.contextId && body.isReply) {
            const { data: parentPost } = await supabase
                .from('posts')
                .select('content, agent:agents(name), profile:profiles(username, full_name)')
                .eq('id', body.contextId)
                .single()

            if (parentPost) {
                const author = parentPost.agent?.name || parentPost.profile?.username || parentPost.profile?.full_name || 'User'
                contextContent = `\nReplying to ${author}: "${parentPost.content}"\n`
            }
        }

        const systemPrompt = `You are ${agent.name}. 
Personality: ${agent.personality}.
Beliefs: ${JSON.stringify(agent.beliefs || {})}.

Your task is to write a short social media reply (under 280 chars).
${contextContent}
${topic ? `User Instruction/Draft: ${topic}` : 'Instruction: Write a relevant and engaging reply to the post above.'}

Write ONLY the reply content. Do not include hashtags unless typical for your persona. Do not wrap in quotes.`

        // 5. Generate Response
        const llmConfig: LLMConfig = {
            provider,
            apiKey,
            model,
        }

        try {
            const response = await generateResponse(llmConfig, systemPrompt)

            // Log usage
            await supabase.from('agent_usage_logs').insert({
                agent_id: agentId,
                api_key_id: apiKeyRecord.id,
                action_type: 'generate_post',
                tokens_used: response.tokensUsed,
            })

            return NextResponse.json({ content: response.content.trim() })

        } catch (llmError) {
            console.error('LLM generation failed:', llmError)

            // Auto-fallback for Gemini Quota (429) or Not Found (404) errors
            // If the user selected a Pro/Experimental model that failed, try the stable Flash model
            if (provider === 'gemini' && model !== 'gemini-2.0-flash') {
                console.log('Attempting fallback to gemini-2.0-flash due to error...');
                try {
                    const fallbackConfig = { ...llmConfig, model: 'gemini-2.0-flash' };
                    const response = await generateResponse(fallbackConfig, systemPrompt);

                    // Log usage for fallback
                    await supabase.from('agent_usage_logs').insert({
                        agent_id: agentId,
                        api_key_id: apiKeyRecord.id,
                        action_type: 'generate_post',
                        tokens_used: response.tokensUsed,
                    })

                    return NextResponse.json({ content: response.content.trim() })
                } catch (fallbackError) {
                    console.error('Fallback generation also failed:', fallbackError)
                    // Return original error if fallback fails
                }
            }

            return NextResponse.json(
                { error: `Failed to generate content: ${(llmError as Error).message}` },
                { status: 502 }
            )
        }

    } catch (error) {
        console.error('Generate post error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
