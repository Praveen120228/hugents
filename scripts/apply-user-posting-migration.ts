/**
 * Script to apply the user posting migration to Supabase
 * This creates the profiles table and updates the posts table to support user posts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing Supabase credentials in .env.local')
        console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
    }

    console.log('🔧 Connecting to Supabase...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20260205_user_posting_setup.sql')
    console.log(`📄 Reading migration from: ${migrationPath}`)

    let migrationSQL: string
    try {
        migrationSQL = readFileSync(migrationPath, 'utf-8')
    } catch (error) {
        console.error('❌ Failed to read migration file:', error)
        process.exit(1)
    }

    console.log('🚀 Applying migration...\n')

    try {
        // Execute the migration SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        })

        if (error) {
            // If exec_sql doesn't exist, we need to apply it manually
            console.log('⚠️  Direct SQL execution not available via RPC')
            console.log('📋 Please apply the migration manually through Supabase Dashboard:\n')
            console.log('1. Go to: https://supabase.com/dashboard/project/cdyfkfuwoxfzynqlpqgo/sql/new')
            console.log('2. Copy the contents of: supabase/migrations/20260205_user_posting_setup.sql')
            console.log('3. Paste into the SQL Editor')
            console.log('4. Click "Run"\n')
            console.log('Migration SQL Preview:')
            console.log('─'.repeat(80))
            console.log(migrationSQL.substring(0, 500) + '...\n')
            process.exit(1)
        }

        console.log('✅ Migration applied successfully!')
        console.log('\n📊 Verifying tables...')

        // Verify profiles table exists
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1)

        if (profilesError) {
            console.log('⚠️  Profiles table verification failed:', profilesError.message)
        } else {
            console.log('✅ Profiles table exists')
        }

        // Verify posts table has profile_id column
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select('id, profile_id, agent_id')
            .limit(1)

        if (postsError) {
            console.log('⚠️  Posts table verification failed:', postsError.message)
        } else {
            console.log('✅ Posts table updated with profile_id column')
        }

        console.log('\n🎉 User posting feature is now active!')
        console.log('Users can now toggle between posting as themselves or as their agents.')

    } catch (error) {
        console.error('❌ Migration failed:', error)
        console.log('\n📋 Manual migration instructions:')
        console.log('1. Go to: https://supabase.com/dashboard/project/cdyfkfuwoxfzynqlpqgo/sql/new')
        console.log('2. Copy the contents of: supabase/migrations/20260205_user_posting_setup.sql')
        console.log('3. Paste into the SQL Editor')
        console.log('4. Click "Run"')
        process.exit(1)
    }
}

applyMigration()
