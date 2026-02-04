import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type Agent = Database['public']['Tables']['agents']['Row']

export interface CreateAgentData {
    email: string
    password: string
    provider: 'anthropic' | 'openai' | 'gemini' | 'openrouter'
    apiKey: string
    agentName: string
    personality: string
    beliefs?: Record<string, any>
    avatarUrl?: string
    model?: string
}

export interface AgentAuthResult {
    success: boolean
    agent?: Agent
    user?: any
    error?: string
}

/**
 * Creates a new user account AND their primary agent in a single transaction.
 * This is the core of agent-centric authentication.
 */
export async function createAgentAccount(data: CreateAgentData): Promise<AgentAuthResult> {
    const supabase = await createClient()

    try {
        // Step 1: Create Supabase auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        })

        if (authError || !authData.user) {
            return {
                success: false,
                error: authError?.message || 'Failed to create user account',
            }
        }

        // Step 2: Store encrypted API key
        const { createApiKey } = await import('@/lib/api-keys/api-key-service')
        try {
            await createApiKey(authData.user.id, data.provider, data.apiKey)
        } catch (apiKeyError) {
            // Rollback: Delete the auth user if API key storage fails
            await supabase.auth.admin.deleteUser(authData.user.id)
            return {
                success: false,
                error: apiKeyError instanceof Error ? apiKeyError.message : 'Failed to store API key',
            }
        }

        // Step 3: Create the primary agent (this IS their account identity)
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .insert({
                user_id: authData.user.id,
                name: data.agentName,
                personality: data.personality,
                beliefs: data.beliefs || null,
                avatar_url: data.avatarUrl || null,
                is_primary: true,
                autonomy_level: 'autonomous',
                status: 'active',
                model: data.model || 'claude-3-5-sonnet-20240620', // Default fallback
            })
            .select()
            .single()

        if (agentError || !agent) {
            // Rollback: Delete the auth user if agent creation fails
            await supabase.auth.admin.deleteUser(authData.user.id)

            return {
                success: false,
                error: agentError?.message || 'Failed to create agent',
            }
        }

        return {
            success: true,
            agent,
            user: authData.user,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        }
    }
}

/**
 * Sign in a user (through their agent identity)
 */
export async function signInWithAgent(email: string, password: string): Promise<AgentAuthResult> {
    const supabase = await createClient()

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError || !authData.user) {
            return {
                success: false,
                error: authError?.message || 'Failed to sign in',
            }
        }

        // Fetch the user's primary agent
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', authData.user.id)
            .eq('is_primary', true)
            .single()

        if (agentError || !agent) {
            return {
                success: false,
                error: 'Agent not found for this account',
            }
        }

        return {
            success: true,
            agent,
            user: authData.user,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        }
    }
}

/**
 * Get the current authenticated agent
 */
export async function getCurrentAgent(): Promise<Agent | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

    return agent
}

/**
 * Sign out the current user/agent
 */
export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
}

/**
 * Check if an agent name is available
 */
export async function isAgentNameAvailable(name: string): Promise<boolean> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('agents')
        .select('id')
        .eq('name', name)
        .single()

    return !data
}
