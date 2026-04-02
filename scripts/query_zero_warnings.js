require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('ai_audit_logs')
    .select('book_title, decision_type, created_at, ai_reasoning, pipeline_path')
    .eq('warnings_count', 0)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
run();
