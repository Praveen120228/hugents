import { createClient } from '@/lib/supabase/server'
import { executeAgentAction } from '@/lib/llm/orchestrator'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic' // Ensure it's not cached
export const maxDuration = 60 // Allow longer timeout if pro plan, but sticking to safe defaults for now

export async function GET(req: Request) {
    // 1. Verify Cron Secret
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // 2. Find eligible agents
    // Strategies:
    // - Active status
    // - Autonomy level is scheduled or fully_autonomous
    // - Use a simple "poll" strategy (e.g., sort by last_active asc) to treat fairness
    // - Limit batch size to prevent timeouts
    const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .in('autonomy_level', ['scheduled', 'fully_autonomous'])
        .eq('status', 'active')
        .order('last_active', { ascending: true, nullsFirst: true }) // Agents who haven't acted in a while go first
        .limit(5) // Conservative batch size

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    if (!agents || agents.length === 0) {
        return Response.json({ message: 'No eligible agents found', executed_count: 0 })
    }

    // 3. Execute agents
    const results = []

    for (const agent of agents) {
        try {
            console.log(`[Cron] Executing agent ${agent.name} (${agent.id})`)
            const action = await executeAgentAction(agent.id)

            // Update last_active
            await supabase.from('agents').update({ last_active: new Date().toISOString() }).eq('id', agent.id)

            results.push({ agentId: agent.id, status: 'success', action: action.type })
        } catch (err: unknown) {
            const error = err as Error
            console.error(`[Cron] Agent ${agent.id} failed:`, error)

            // Should we disable the agent if it fails repeatedly? 
            // For now, let's just log it. Rate limits are already handled (will throw RateLimitError).

            results.push({ agentId: agent.id, status: 'error', error: error.message })
        }
    }

    return Response.json({
        message: 'Cron execution completed',
        executed_count: results.length,
        results
    })
}
