/**
 * Quick analysis of model usage in deep scans
 * Run with: npx tsx scripts/analyze-model-usage.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeModelUsage() {
    console.log('=== Model Usage Analysis ===\n')

    // 1. Audit logs by pipeline_path (shows deep vs quick scans)
    console.log('1. Scans by Pipeline Path:')
    const { data: pipelineStats, error: pipelineError } = await supabase
        .from('ai_audit_logs')
        .select('pipeline_path, decision_type')
        .not('pipeline_path', 'is', null)

    if (pipelineError) {
        console.error('Error fetching pipeline stats:', pipelineError.message)
    } else {
        const pipelineCounts: Record<string, { total: number, warnings: number }> = {}
        for (const row of pipelineStats || []) {
            const path = row.pipeline_path || 'unknown'
            if (!pipelineCounts[path]) {
                pipelineCounts[path] = { total: 0, warnings: 0 }
            }
            pipelineCounts[path].total++
            if (row.decision_type === 'warnings_generated') {
                pipelineCounts[path].warnings++
            }
        }
        console.table(pipelineCounts)
    }

    // 2. Content warnings by model_used
    console.log('\n2. Content Warnings by Model:')
    const { data: warningsByModel, error: modelError } = await supabase
        .from('content_warnings')
        .select('model_used')

    if (modelError) {
        console.error('Error fetching warnings by model:', modelError.message)
    } else {
        const modelCounts: Record<string, number> = { openai: 0, gemini: 0, multi: 0, null: 0 }
        for (const row of warningsByModel || []) {
            const model = row.model_used || 'null'
            modelCounts[model] = (modelCounts[model] || 0) + 1
        }
        console.table(modelCounts)
    }

    // 3. Recent audit logs with model details
    console.log('\n3. Recent 20 Scans (with model details):')
    const { data: recentLogs, error: recentError } = await supabase
        .from('ai_audit_logs')
        .select('book_title, pipeline_path, decision_type, warnings_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

    if (recentError) {
        console.error('Error fetching recent logs:', recentError.message)
    } else {
        console.table(recentLogs?.map(r => ({
            title: (r.book_title || '').substring(0, 30),
            pipeline: r.pipeline_path,
            decision: r.decision_type,
            warnings: r.warnings_count,
            date: new Date(r.created_at).toLocaleDateString()
        })))
    }

    // 4. Average warnings by pipeline path
    console.log('\n4. Average Warnings by Pipeline:')
    const { data: avgWarnings, error: avgError } = await supabase
        .from('ai_audit_logs')
        .select('pipeline_path, warnings_count')
        .eq('decision_type', 'warnings_generated')
        .not('pipeline_path', 'is', null)

    if (avgError) {
        console.error('Error:', avgError.message)
    } else {
        const avgByPath: Record<string, { sum: number, count: number }> = {}
        for (const row of avgWarnings || []) {
            const path = row.pipeline_path || 'unknown'
            if (!avgByPath[path]) {
                avgByPath[path] = { sum: 0, count: 0 }
            }
            avgByPath[path].sum += row.warnings_count || 0
            avgByPath[path].count++
        }
        const result: Record<string, number> = {}
        for (const [path, data] of Object.entries(avgByPath)) {
            result[path] = Math.round((data.sum / data.count) * 10) / 10
        }
        console.table(result)
    }
}

analyzeModelUsage().catch(console.error)
