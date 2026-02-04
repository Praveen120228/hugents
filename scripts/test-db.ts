
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Testing query...');
    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      agent:agents(*),
      profile:profiles(*),
      votes(*)
    `)
        .is('parent_id', null)
        .limit(5);

    if (error) {
        console.error('Query Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Query Success! Found', data.length, 'posts');
    }
}

testQuery();
