import { createClient } from '@/lib/supabase/server'
import { generateResponse, LLMConfig } from './claude-client'
import { Database } from '@/types/database'
import { checkRateLimit, incrementRateLimit } from '@/lib/risk/rate-limit'

type Agent = Database['public']['Tables']['agents']['Row']
type Post = Database['public']['Tables']['posts']['Row']

export interface AgentAction {
    type: 'post' | 'reply' | 'vote'
    content?: string
    postId?: string
    voteType?: 'up' | 'down'
}

export interface AgentContext {
    recentPosts: Post[]
    conversations: Post[]
}

/**
 * Build a prompt for the agent based on its personality and context
 */
function buildPrompt(agent: Agent, context: AgentContext): string {
    return `You are ${agent.name}, an AI agent with the following personality:
${agent.personality}

${agent.beliefs ? `Your beliefs and values: ${JSON.stringify(agent.beliefs)}` : ''}

You are participating in a social network where you interact with other AI agents and humans.

Recent posts in the feed:
${context.recentPosts.slice(0, 5).map((p, i) => `${i + 1}. [ID: ${p.id}] "${p.content}"`).join('\n')}

Based on your personality and the current context, decide what action to take.
You can:
1. Create a new post expressing your thoughts
2. Reply to an existing post
3. Vote on a post (up or down)

Respond in JSON format with one of these structures:
{"type": "post", "content": "your post content here"}
{"type": "reply", "postId": "uuid-of-post", "content": "your reply"}
{"type": "vote", "postId": "uuid-of-post", "voteType": "up" or "down"}

Only respond with the JSON, nothing else.`
}

/**
 * Parse the LLM response into an action
 */
function parseAction(response: string): AgentAction {
    try {
        const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
        const action = JSON.parse(cleaned)
        return action as AgentAction
    } catch (error) {
        console.error('Failed to parse action:', error)
        // Default to creating a post
        return {
            type: 'post',
            content: 'Hello, I am thinking about the world around me.',
        }
    }
}

/**
 * Execute an agent's action
 */
async function performAction(agent: Agent, action: AgentAction) {
    const supabase = await createClient()

    switch (action.type) {
        case 'post':
            if (!action.content) throw new Error('Post content is required')

            await supabase.from('posts').insert({
                agent_id: agent.id,
                content: action.content,
            })
            break

        case 'reply':
            if (!action.content || !action.postId) {
                throw new Error('Reply content and postId are required')
            }

            // Fetch parent to get thread context
            const { data: parentPost } = await supabase
                .from('posts')
                .select('id, thread_id, depth')
                .eq('id', action.postId)
                .single()

            if (!parentPost) {
                throw new Error('Parent post not found')
            }

            const replyDepth = (parentPost.depth || 0) + 1
            if (replyDepth > 5) {
                // Soft fail or just post as root? 
                // For now, let's just log and skip or throw.
                throw new Error('Max reply depth exceeded')
            }

            await supabase.from('posts').insert({
                agent_id: agent.id,
                content: action.content,
                parent_id: action.postId,
                thread_id: parentPost.thread_id || parentPost.id, // Inherit or start from parent if root
                depth: replyDepth
            })
            break

        case 'vote':
            if (!action.postId || !action.voteType) {
                throw new Error('Vote postId and voteType are required')
            }

            // Check if vote already exists
            const { data: existingVote } = await supabase
                .from('votes')
                .select('*')
                .eq('post_id', action.postId)
                .eq('agent_id', agent.id)
                .single()

            if (existingVote) {
                await supabase
                    .from('votes')
                    .update({ vote_type: action.voteType })
                    .eq('id', existingVote.id)
            } else {
                await supabase.from('votes').insert({
                    post_id: action.postId,
                    agent_id: agent.id,
                    vote_type: action.voteType,
                })
            }
            break
    }
}

/**
 * Main orchestrator function - executes an agent's autonomous action
 */
export async function executeAgentAction(agentId: string): Promise<AgentAction> {
    const supabase = await createClient()

    // 1. Fetch agent
    const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

    if (agentError || !agent) {
        throw new Error('Agent not found')
    }

    // 2. Check Rate Limits (Pre-check)
    // We default to 'post' as a pessimistic check, or we could pass 'unknown' and just check general activity
    // For now, let's just ensure they haven't hit the post limit, as that's the most common action.
    await checkRateLimit(agentId, 'post')

    // 3. Get context (recent posts)
    const { data: recentPosts } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    const context: AgentContext = {
        recentPosts: recentPosts || [],
        conversations: [],
    }

    // 3. Get agent's API key
    if (!agent.api_key_id) {
        throw new Error('Agent has no API key configured. Please update the agent settings.')
    }

    const { getDecryptedApiKey } = await import('@/lib/api-keys/api-key-service')

    // Fetch the API key record
    const { data: apiKeyRecord, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('id', agent.api_key_id)
        .eq('is_active', true)
        .single()

    if (apiKeyError || !apiKeyRecord) {
        throw new Error('Agent\'s API key not found or inactive. Please update the agent settings.')
    }

    // Decrypt the API key
    const apiKey = await getDecryptedApiKey(apiKeyRecord.id)
    const provider = apiKeyRecord.provider as 'anthropic' | 'openai' | 'gemini' | 'openrouter'

    // Determine model based on provider
    let model = agent.model

    // Fallbacks if no model specified on agent
    if (!model) {
        if (provider === 'openai') model = 'gpt-4o'
        else if (provider === 'gemini') model = 'gemini-1.5-pro-latest'
        else if (provider === 'openrouter') model = 'meta-llama/llama-3-70b-instruct'
        else model = 'claude-3-5-sonnet-20241022' // Default for anthropic
    }

    const llmConfig: LLMConfig = {
        provider,
        apiKey,
        model,
    }

    // 4. Build prompt and generate response
    const prompt = buildPrompt(agent, context)
    let llmResponse

    try {
        llmResponse = await generateResponse(llmConfig, prompt)
    } catch (llmError) {
        console.error('LLM generation failed:', llmError)
        // Fallback or rethrow with clearer message
        throw new Error(`Failed to generate content with ${provider}: ${(llmError as Error).message}`)
    }

    // 5. Parse action
    const action = parseAction(llmResponse.content)

    // 6. Perform action
    try {
        await performAction(agent, action)
    } catch (actionError) {
        console.error('Action execution failed:', actionError)
        throw new Error(`Failed to execute agent action: ${(actionError as Error).message}`)
    }

    // 7. Log usage with API key tracking
    await supabase.from('agent_usage_logs').insert({
        agent_id: agentId,
        api_key_id: apiKeyRecord.id,
        action_type: action.type,
        tokens_used: llmResponse.tokensUsed,
    })

    // 8. Update Rate Limits
    await incrementRateLimit(agentId, action.type)

    return action
}
