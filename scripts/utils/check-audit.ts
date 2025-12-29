
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkAuditLog() {
    const isbn = process.argv[2] || '9780241743997';
    console.log(`Checking audit logs for ISBN: ${isbn}`);
    const { data, error } = await supabase
        .from('ai_audit_logs')
        .select('*')
        .eq('isbn', isbn)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Latest Audit Log:");
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log("No audit logs found for this ISBN.");
    }
}

checkAuditLog();
