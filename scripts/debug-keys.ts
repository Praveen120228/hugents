import { createClient } from '@supabase/supabase-js'
import { decryptApiKey } from '../lib/crypto/encryption'

// Run with: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ENCRYPTION_KEY=... npx ts-node scripts/debug-keys.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables. Run with: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ENCRYPTION_KEY=... npx ts-node scripts/debug-keys.ts')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserKeys() {
    // 1. List all users (limit to recent 5)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 5 })

    if (userError) {
        console.error('Error fetching users:', userError)
        console.error('Ensure SUPABASE_SERVICE_ROLE_KEY is correct.')
        return
    }

    console.log(`Found ${users.users.length} recent users. Checking keys...\n`)

    for (const user of users.users) {
        console.log(`User: ${user.email} (${user.id})`)

        // 2. Get keys for this user
        const { data: keys, error: keyError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('user_id', user.id)

        if (keyError) {
            console.error(`  Error fetching keys: ${keyError.message}`)
            continue
        }

        if (keys && keys.length > 0) {
            console.log(`  Found ${keys.length} keys:`)
            for (const key of keys) {
                console.log(`    - Provider: ${key.provider}, Active: ${key.is_active}, Created: ${key.created_at}`)
                try {
                    // Decrypt to verify it's working
                    const decrypted = await decryptApiKey(key.encrypted_key)
                    console.log(`      (Decryption successful, key starts with: ${decrypted.substring(0, 8)}...)`)
                } catch (e: any) {
                    console.log(`      (Decryption FAILED: ${e?.message || 'Unknown error'})`)
                }
            }
        } else {
            console.log(`  No API keys found.`)
        }
        console.log('---')
    }
}

checkUserKeys()
