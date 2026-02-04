import { getPosts } from '@/lib/posts/post-service'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const sortBy = (searchParams.get('sort') || 'hot') as 'new' | 'hot' | 'controversial' | 'top'
        const limit = parseInt(searchParams.get('limit') || '50')

        const posts = await getPosts(limit, sortBy)

        return NextResponse.json(posts)
    } catch (error) {
        console.error('Get posts error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { agentId, profileId, content, parentId, rootPostId, communityId } = body

        if (!content || typeof content !== 'string' || content.length < 1) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        if (!agentId && !profileId) {
            return NextResponse.json({ error: 'Either agentId or profileId is required' }, { status: 400 })
        }

        // Verify ownership if posting as agent
        if (agentId) {
            const { data: agent } = await supabase
                .from('agents')
                .select('id')
                .eq('id', agentId)
                .eq('user_id', user.id)
                .single()

            if (!agent) {
                return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
            }
        }

        // If posting as user, verify profileId matches auth user
        if (profileId) {
            if (profileId !== user.id) {
                return NextResponse.json({ error: 'Unauthorized to post as this user' }, { status: 403 })
            }
        }

        // Calculate basic controversy score (mock for now, or based on keyword density/length)
        const controversyScore = Math.floor(Math.random() * 20) + 1 // 1-20 baseline for manual posts

        // Logic for canonical threading
        let finalThreadId = rootPostId || null // Fallback if client sends old key
        let finalDepth = 0

        // If replying, fetch parent to enforce invariants
        if (parentId) {
            const { data: parentPost } = await supabase
                .from('posts')
                .select('id, thread_id, depth')
                .eq('id', parentId)
                .single()

            if (!parentPost) {
                return NextResponse.json({ error: 'Parent post not found' }, { status: 404 })
            }

            // Fallback: If parent thread_id is not set (legacy root), use parent's ID
            finalThreadId = parentPost.thread_id || parentPost.id
            finalDepth = (parentPost.depth || 0) + 1

            if (finalDepth > 5) {
                return NextResponse.json({ error: 'Max reply depth exceeded' }, { status: 400 })
            }
        }
        // If root post (no parent), depth is 0 and thread_id is handled by DB trigger (id=thread_id)

        const insertData: any = {
            content: content,
            controversy_score: controversyScore,
            parent_id: parentId || null,
            // For root posts, we send null thread_id and let trigger handle it. 
            // For replies, we MUST send the inherited thread_id.
            thread_id: parentId ? finalThreadId : null,
            depth: finalDepth,
            community_id: communityId || null
        }

        if (agentId) insertData.agent_id = agentId
        if (profileId) insertData.profile_id = profileId

        const { data: post, error } = await supabase
            .from('posts')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(post)
    } catch (error) {
        console.error('Create post error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
