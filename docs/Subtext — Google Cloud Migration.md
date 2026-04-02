Subtext — Google Cloud Migration
Developer Brief & Questions
Background & Goal
We're currently running Subtext (subtextscanner.com.au) on a paid Supabase Pro plan (~$25 USD/month). The database costs are manageable but the bigger cost driver is API calls for book content analysis. We want to explore migrating to Google Cloud's free tier to reduce or eliminate infrastructure costs.
The plan is to fork the codebase and build a parallel Google Cloud version, test it, then switch the domain over once confirmed working — keeping the current live app running throughout.

1. Current Stack — What We Need to Confirm
💡 Please answer each of these so we can plan the migration accurately.

Backend
What language/framework is the backend built in? (e.g. Node/Express, Python/FastAPI, etc.)
Where is the backend currently hosted? (e.g. Vercel, Railway, Render, a VPS?)
What is the entry point / main server file?

Database (Supabase)
What tables exist in the Supabase database?
Are book analysis results being cached in the DB, or is the API called fresh every time a book is searched?
Is Supabase being used for auth/user management, or just data storage, or both?
Roughly how much data is in the DB right now? (Check Supabase dashboard → Settings → Usage)
Are we on the Supabase Pro plan ($25/month)? Please confirm in Settings → Billing.

AI / Content Analysis API
Which AI API are we calling for content analysis? (OpenAI, Anthropic/Claude, Google Gemini, other?)
What is the approximate monthly API cost right now?
Is there a system prompt or specific model being used? (e.g. gpt-4o, claude-3-5-sonnet, gemini-1.5-pro)
Is the same book ever analysed more than once, or do we cache results after first analysis?

Frontend
What framework is the frontend? (React, Next.js, Vue, other?)
Where is the frontend hosted currently?




2. Proposed Google Cloud Stack (Free Tier)
💡 This is what we're proposing to migrate to — confirm if anything looks incompatible with our setup.

The goal is to replace paid services with Google Cloud always-free equivalents:

Supabase DB → Google Firestore (free: 50k reads/day, 20k writes/day, 1GB storage)
Supabase Auth → Firebase Auth (free tier, drop-in replacement)
Backend hosting → Google Cloud Run (free: 2M requests/month)
AI API → Google Gemini API (free tier available — investigate if quality is sufficient)
File/asset storage → Google Cloud Storage (free: 5GB)

💡 If we're using OpenAI or Anthropic and the quality is critical, we may want to keep that and only migrate the DB/hosting. Please flag if switching AI provider is a concern.




3. Migration Tasks
💡 Once we have answers to Section 1, these are the likely tasks for the fork. Please estimate effort for each.

High Priority
Set up a Google Cloud project and enable free tier services
Create Firestore DB schema to match current Supabase tables
Write migration script to copy existing Supabase data into Firestore
Replace Supabase client calls in backend with Firestore SDK
Replace Supabase Auth with Firebase Auth (or assess alternatives)
Deploy backend to Cloud Run
Test all endpoints against the new DB

If Switching AI Provider
Test Gemini API against same book samples — compare output quality
Update prompts as needed for Gemini (may need minor adjustments)
Update API call code to use Gemini SDK
Confirm caching is implemented so each book is only ever analysed once

Go-Live
Run both versions in parallel for 1-2 weeks
Verify parity between old and new versions
Update DNS / domain to point to new stack
Cancel Supabase Pro plan once confirmed stable




4. Key Questions for Developer

Is the codebase on GitHub? If so, what's the repo — can we fork it cleanly?
Are there any environment variables / secrets we need to rotate when migrating?
Is there anything in the current setup that is tightly coupled to Supabase (e.g. Supabase realtime, edge functions, storage buckets)?
What is your estimated effort/time for the migration?
Any concerns or blockers you can foresee?

Prepared for Cursor — Subtext Engineering Brief
