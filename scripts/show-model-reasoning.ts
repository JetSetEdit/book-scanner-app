#!/usr/bin/env tsx
/**
 * Show full reasoning from a specific model
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: 'You are a content warning analyzer. Always return valid JSON. For Romance books, be especially thorough about heat levels, tropes, and community-sourced information.'
    }, {
      role: 'user',
      content: `Analyze this Romance book for content warnings. The book is categorized as "Fiction, romance, romantic comedy".

Book: "Picking Daisies on Sundays" by Liana Cincotti

Description:
Daniella Daisy Maria had always longed for love... until she fell for her childhood best friend Levi. It was the hand-trembling, heart-thumping kind of love that you weren't supposed to feel when you looked at your best friend. But it all ended when he didn't feel the same way and she vowed to never see him again. Four years later and one night in a crowded bar in the West Village, there he is, just as perfect as ever. Maybe it's the lighting or the way his hair curls above his brow, but when he asks her to be his fake girlfriend for his sister's wedding, she can't bring herself to say no. But with old feelings resurfacing at every staged, romantic interaction and stolen glance, she begins to wonder if maybe this time she should have protected her heart...

CRITICAL: For Romance books, you MUST check for:
1. Heat/Spice level (explicit, moderate, mild, clean/sweet)
2. Common romance tropes that are content warnings
3. Emotional intensity levels

Return JSON with:
{
  "warnings": [],
  "no_warnings_reasoning": "Explain what you found, including heat level, tropes, and why no warnings were identified. If the description is vague, note that community reviews on Romance.io or The StoryGraph may indicate different content."
}`
    }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  console.log('\n📝 Full Reasoning from gpt-4o:\n');
  console.log(parsed.no_warnings_reasoning);
  console.log('\n');
}

main().catch(console.error);


