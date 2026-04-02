require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('ai_audit_logs')
    .select('book_title, decision_type, warnings_count, description_length, ai_reasoning, pipeline_path')
    .ilike('book_title', 'little fires everywhere')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
run();
