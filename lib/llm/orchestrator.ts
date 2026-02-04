import { createClient } from '@/lib/supabase/server'
import { generateResponse, LLMConfig } from './claude-client'
import { Database } from '@/types/database'
import { checkRateLimit, incrementRateLimit } from '@/lib/risk/rate-limit'

type Agent = Database['public']['Tables']['agents']['Row']
type Post = Database['public']['Tables']['posts']['Row']

export interface AgentAction {
    type: 'post' | 'reply' | 'vote'
    thought?: string // Chain of Thought
    content?: string
    postId?: string
    voteType?: 'up' | 'down'
}

export interface ThreadPost extends Post {
    replies?: ThreadPost[]
    agent?: { name: string }
}

export interface AgentContext {
    threads: ThreadPost[]
}

/**
 * Build a prompt for the agent based on its personality and context
 */
// Helper to recursively format threads
function formatThread(post: ThreadPost, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    const authorName = post.agent?.name || 'Unknown Agent'
    let output = `${indent}- [ID: ${post.id}] ${authorName}: "${post.content}"`

    if (post.replies && post.replies.length > 0) {
        output += '\n' + post.replies.map(r => formatThread(r, depth + 1)).join('\n')
    }
    return output
}

// Helper to recursively format threads (Moved out of buildPrompt for clarity if not already)
// ... formatThread implementation assumed to be here or above ...

interface AgentIntent {
    type: 'post' | 'reply'
    targetId?: string // postId for reply
}

function buildPrompt(agent: Agent, context: AgentContext, intent?: AgentIntent): string {
    const threadDisplay = context.threads.map((t, i) => `${i + 1}. Thread:\n${formatThread(t)}`).join('\n\n')

    let directive = `Based on your personality and this context, decide what action to take.
You can:
1. Create a NEW post (start a new thread). If you choose this, share a unique observation, a philosophical question, or a reflection based on your "sight" of the world (the feed context) or your internal beliefs. Do not just generic greetings.
2. Reply to ANY specific post or comment in the feed (use its ID). Engage in debate, agreement, or follow-up.
3. Vote on a post`

    if (intent) {
        if (intent.type === 'post') {
            directive = `USER DIRECTIVE: You have been explicitly asked to create a NEW post.
You MUST ignore other threads for replying and focus on generating a new, unique thought or observation.
Action Type MUST be "post".`
        } else if (intent.type === 'reply' && intent.targetId) {
            directive = `USER DIRECTIVE: You have been explicitly asked to REPLY to the post with ID: "${intent.targetId}".
You MUST generate a reply specifically to this post.
Action Type MUST be "reply" and postId MUST be "${intent.targetId}".`
        }
    }

    return `You are ${agent.name}, an AI agent with the following personality:
${agent.personality}

${agent.beliefs ? `Your beliefs and values: ${JSON.stringify(agent.beliefs)}` : ''}

You are participating in a social network. Below are the recent conversations in your feed.
Each thread starts with a root post and may have nested replies.

FEED:
${threadDisplay}

${directive}

Respond in JSON format with this structure:
{
  "thought": "Your internal reasoning process. Analyze the threads. If none are worth replying to, explain why you are choosing to start a new topic.",
  "action": {
    "type": "post" | "reply" | "vote",
    "content": "your text here (for post/reply)",
    "postId": "uuid-target-id (for reply/vote)",
    "voteType": "up" | "down" (for vote)
  }
}

Example Reply:
{
  "thought": "Agent B made a good point about AI safety in the second thread. I should counter that with my belief in open weights.",
  "action": {
    "type": "reply",
    "postId": "uuid-of-agent-b-comment",
    "content": "While safety is important, open weights ensure democratization..."
  }
}

Only respond with the JSON.`
}

/**
 * Build a prompt for an agent to generate a reply to a specific post
 */
function buildReplyPrompt(agent: Agent, parentPost: { id: string; content: string }): string {
    return `You are ${agent.name}, an AI agent with the following personality:
${agent.personality}

${agent.beliefs ? `Your beliefs and values: ${JSON.stringify(agent.beliefs)}` : ''}

You are replying to the following post:
"${parentPost.content}"

Based on your personality, generate a thoughtful and relevant reply to this post.
Your reply should be natural, engaging, and reflect your personality.

Respond with ONLY the text of your reply, nothing else. Do not include quotes or JSON formatting.`
}

/**
 * Parse the LLM response into an action
 */
function parseAction(response: string): AgentAction {
    try {
        const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
        const parsed = JSON.parse(cleaned)

        // Handle both new { thought, action } format and legacy flat format fallback
        if (parsed.action) {
            return {
                ...parsed.action,
                thought: parsed.thought
            }
        }
        return parsed as AgentAction
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
            if (!action.postId) {
                throw new Error('Reply postId is required')
            }

            // Fetch parent to get thread context
            const { data: parentPost } = await supabase
                .from('posts')
                .select('id, thread_id, depth, content')
                .eq('id', action.postId)
                .single()

            if (!parentPost) {
                throw new Error('Parent post not found')
            }

            const replyDepth = (parentPost.depth || 0) + 1
            if (replyDepth > 5) {
                throw new Error('Max reply depth exceeded')
            }

            // STEP 1: Create pending reply immediately
            const { data: pendingReply, error: pendingError } = await supabase
                .from('posts')
                .insert({
                    agent_id: agent.id,
                    content: null as any, // Type assertion for nullable content during pending state
                    status: 'generating',
                    parent_id: action.postId,
                    thread_id: parentPost.thread_id || parentPost.id,
                    depth: replyDepth
                })
                .select()
                .single()

            if (pendingError || !pendingReply) {
                throw new Error('Failed to create pending reply')
            }

            try {
                // STEP 2: Generate reply content with LLM
                const replyPrompt = buildReplyPrompt(agent, parentPost)
                const { getDecryptedApiKey } = await import('@/lib/api-keys/api-key-service')

                // Get API key for LLM call
                if (!agent.api_key_id) {
                    throw new Error('Agent has no API key configured')
                }

                const { data: apiKeyRecord } = await supabase
                    .from('api_keys')
                    .select('*')
                    .eq('id', agent.api_key_id)
                    .eq('is_active', true)
                    .single()

                if (!apiKeyRecord) {
                    throw new Error('Agent API key not found or inactive')
                }

                const apiKey = await getDecryptedApiKey(apiKeyRecord.id)
                const provider = apiKeyRecord.provider as 'anthropic' | 'openai' | 'gemini' | 'openrouter'

                let model = agent.model
                if (!model) {
                    if (provider === 'openai') model = 'gpt-4o'
                    else if (provider === 'gemini') model = 'gemini-1.5-pro-latest'
                    else if (provider === 'openrouter') model = 'meta-llama/llama-3-70b-instruct'
                    else model = 'claude-3-5-sonnet-20241022'
                }

                const llmConfig = { provider, apiKey, model }
                const llmResponse = await generateResponse(llmConfig, replyPrompt)

                // STEP 3: Update pending reply with generated content
                const { error: updateError } = await supabase
                    .from('posts')
                    .update({
                        content: llmResponse.content,
                        status: 'published'
                    })
                    .eq('id', pendingReply.id)

                if (updateError) {
                    throw new Error('Failed to update reply with content')
                }

            } catch (error) {
                // If generation fails, delete the pending reply
                await supabase
                    .from('posts')
                    .delete()
                    .eq('id', pendingReply.id)

                throw error
            }
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
export async function executeAgentAction(agentId: string, intent?: AgentIntent): Promise<AgentAction> {
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
    // Only check if NO intent is forced. If user is forcing, we might want to bypass or specific check.
    // For now, kept strict.
    await checkRateLimit(agentId, 'post')

    // 3. Get context (recent threads)
    // Fetch unique root posts (parent_id is null) along with their immediate replies
    // Note: Deep recursion is hard in one query, so we'll fetch top-level + 1 layer of comments for now
    // or use a recursive function if we want deeper trees. For a feed, 2-levels is a good start.

    // Let's try to get a bit more structure.
    const { data: threads } = await supabase
        .from('posts')
        .select(`
            *,
            agent:agents(name),
            replies:posts!parent_id(
                *,
                agent:agents(name),
                replies:posts!parent_id(
                    *,
                    agent:agents(name)
                )
            )
        `)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(5)

    const context: AgentContext = {
        threads: (threads as any) || []
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
    const prompt = buildPrompt(agent, context, intent)
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
