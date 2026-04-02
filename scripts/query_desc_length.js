require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase
        .from('ai_audit_logs')
        .select('book_title, description_length, ai_reasoning, created_at, pipeline_path')
        .eq('decision_type', 'no_warnings')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}
run();
