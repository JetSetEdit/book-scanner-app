# Current Workflow - Complete System Flow

## Overview

This document describes the complete workflow for the book scanner app, including agent improvements, ML training, and production deployment.

---

## 1. Production System Flow (Current)

### User Scans a Book

```
User scans ISBN
    ↓
processIsbnScan() in lib/services/scan-service.ts
    ↓
Check if book exists in database
    ↓
If not found → Fetch from Google Books / Open Library
    ↓
Analyze with multi-model-analysis.ts
    ├─ OpenAI (GPT-4o) analysis
    └─ Gemini analysis (if available)
    ↓
Generate content warnings using Taxonomy v2.5.0
    ↓
Save to database
    ↓
Return results to user
```

### Agent System (Alternative/Experimental)

```
User scans ISBN
    ↓
processIsbnScan() with agent mode
    ↓
content-warning-agent.ts
    ├─ Old Agent: Assumption-based
    ├─ New Agent: Evidence-based only
    └─ Hybrid Agent: Evidence-first, then inference
    ↓
Web search if description missing/thin
    ↓
Generate warnings
    ↓
Return results
```

**Key Improvements:**
- ✅ TPM rate limit retry (waits for reset token)
- ✅ Web search optimization (60-70% token reduction)
- ✅ Fallback submit calls (always returns valid response)
- ✅ 60-second timeout (prevents hanging)

---

## 2. ML Training System Flow

### Build and Train Workflow

```bash
# Step 1: Export existing training data from database
npx tsx scripts/export-training-data.ts
# → Creates: data/training/exported_training_data.json

# Step 2: (Optional) Scan more books for training
NODE_OPTIONS="--require dotenv/config" DOTENV_CONFIG_PATH=.env.local \
  npx tsx scripts/intelligent-training-collector.ts --budget 5 --max-books 20
# → Creates: data/training/intelligent_training_data.json

# Step 3: Combine all training data sources
npx tsx scripts/combine-training-data.ts
# → Creates: data/training/combined_training_data.json

# Step 4: Train the classifier model
python3 scripts/train-classifier.py \
  data/training/combined_training_data.json \
  data/models/content_warning_classifier.pkl
# → Creates: data/models/content_warning_classifier.pkl
```

### Intelligent Training Collector Flow

```
Start with budget (e.g., $5)
    ↓
Load random ISBNs from GoodBooks dataset
    ↓
For each ISBN:
    ├─ Fetch book metadata
    ├─ Scan for warnings
    ├─ If no warnings found:
    │   ├─ Web search for content warnings
    │   ├─ Analyze description for warning keywords
    │   └─ Determine if warnings should exist
    ├─ Track token usage
    └─ Save as training example
    ↓
Stop when budget reached or max books scanned
    ↓
Save training data
    ↓
(Optional) Combine and retrain model
```

---

## 3. Testing and Validation Flow

### Test All Agent Configurations

```bash
# Test with specific ISBN
npx tsx scripts/test-all-agent-configs.ts 9780593440872

# Test with random book
npx tsx scripts/test-random-book.ts
```

**What it tests:**
1. Current System (multi-model-analysis.ts)
2. Old Agent (Assumption-based)
3. New Agent (Evidence-based only)
4. Hybrid Agent (Evidence-first, then inference)

**Output:**
- Timing for each config
- Warning counts
- Status (Success/Failed/Partial)
- Comparison table

### Test Single Agent

```bash
npx tsx scripts/test-single-agent.ts
# Tests old agent by default, edit script to change
```

---

## 4. Development Workflow

### Making Changes

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test:**
   ```bash
   # Test locally
   npm run dev
   # Run tests
   npx tsx scripts/test-all-agent-configs.ts
   ```

3. **Commit and push:**
   ```bash
   git add -A
   git commit -m "feat: your change description"
   git push origin feature/your-feature-name
   ```

4. **Merge to main:**
   ```bash
   git checkout main
   git merge feature/your-feature-name
   git push origin main
   ```

### Production Deployment

1. **Code is on main branch** → Auto-deploys via Vercel/GitHub Actions
2. **Monitor logs** for errors
3. **Verify improvements:**
   - Fewer 429 rate limit errors
   - No timeout issues
   - Reduced token usage

---

## 5. Data Collection Workflow

### Collect Training Data with Budget

```bash
# Use $5 budget, scan up to 20 books
NODE_OPTIONS="--require dotenv/config" DOTENV_CONFIG_PATH=.env.local \
  npx tsx scripts/intelligent-training-collector.ts --budget 5 --max-books 20
```

**What happens:**
- Scans random books from GoodBooks dataset
- Investigates books with no warnings
- Tracks token usage
- Stops before exceeding budget
- Saves training examples

### Export Existing Data

```bash
# Export all books with warnings from database
npx tsx scripts/export-training-data.ts
```

---

## 6. Model Training Workflow

### Quick Train (All-in-One)

```bash
# Export, combine, and train in one command
npx tsx scripts/build-and-train.ts --skip-scan
```

### Full Train (With New Data)

```bash
# 1. Collect new training data
NODE_OPTIONS="--require dotenv/config" DOTENV_CONFIG_PATH=.env.local \
  npx tsx scripts/intelligent-training-collector.ts --budget 5 --max-books 20

# 2. Build and train
npx tsx scripts/build-and-train.ts
```

---

## 7. Current System Architecture

### Content Warning Generation

**Primary System (Production):**
- `lib/services/multi-model-analysis.ts`
- Uses OpenAI (GPT-4o) + Gemini
- Fast, reliable, cost-effective

**Agent System (Experimental):**
- `lib/content-warning-agent.ts`
- Three modes: Old, New, Hybrid
- More thorough but slower
- Better for books with missing descriptions

### ML Classifier (Future Integration)

- `data/models/content_warning_classifier.pkl`
- Scikit-learn Random Forest
- Fast local inference (< 10ms)
- Can be used as "prior" before LLM refinement

---

## 8. Key Files Reference

### Core System
- `lib/services/scan-service.ts` - Main scanning logic
- `lib/services/multi-model-analysis.ts` - Current production system
- `lib/content-warning-agent.ts` - Agent system (experimental)

### Training
- `scripts/build-and-train.ts` - Complete training workflow
- `scripts/intelligent-training-collector.ts` - Data collection
- `scripts/combine-training-data.ts` - Combine training sources
- `scripts/train-classifier.py` - Python training script

### Testing
- `scripts/test-all-agent-configs.ts` - Compare all configs
- `scripts/test-random-book.ts` - Test with random books
- `scripts/test-single-agent.ts` - Test one agent

### Data
- `data/training/combined_training_data.json` - All training examples
- `data/models/content_warning_classifier.pkl` - Trained model

---

## 9. Common Tasks

### Task: Improve Agent Performance

1. Test current performance:
   ```bash
   npx tsx scripts/test-all-agent-configs.ts
   ```

2. Review results in comparison table

3. Adjust prompts in `lib/content-warning-agent.ts`

4. Re-test and compare

### Task: Collect More Training Data

1. Run intelligent collector:
   ```bash
   NODE_OPTIONS="--require dotenv/config" DOTENV_CONFIG_PATH=.env.local \
     npx tsx scripts/intelligent-training-collector.ts --budget 5 --max-books 20
   ```

2. Combine data:
   ```bash
   npx tsx scripts/combine-training-data.ts
   ```

3. Retrain model:
   ```bash
   python3 scripts/train-classifier.py \
     data/training/combined_training_data.json \
     data/models/content_warning_classifier.pkl
   ```

### Task: Debug Agent Issues

1. Check agent restoration status:
   ```bash
   cat docs/AGENT_RESTORATION_STATUS.md
   ```

2. Review fixes applied:
   ```bash
   cat docs/AGENT_FIXES_APPLIED.md
   ```

3. Test specific agent:
   ```bash
   npx tsx scripts/test-single-agent.ts
   ```

---

## 10. Production Monitoring

### What to Monitor

1. **Rate Limit Errors (429)**
   - Should decrease with TPM retry logic
   - Check logs for "Rate limit hit, waiting..."

2. **Timeout Errors**
   - Should be eliminated with 60s timeout
   - Check for "Agent execution timeout" messages

3. **Token Usage**
   - Should decrease with web search optimization
   - Monitor API costs

4. **Agent Failures**
   - Should decrease with fallback submit calls
   - Check for "Agent did not call submit" errors

### Where to Check

- Vercel logs (if deployed there)
- Supabase logs (database operations)
- OpenAI dashboard (token usage)
- Application error logs

---

## Summary

**Current Production Flow:**
1. User scans → `processIsbnScan()` → `multi-model-analysis.ts` → Warnings → Database

**Agent System (Experimental):**
1. User scans → `processIsbnScan()` → `content-warning-agent.ts` → Web search (if needed) → Warnings

**Training Flow:**
1. Collect data → Combine → Train → Deploy model

**Testing Flow:**
1. Run tests → Compare results → Adjust → Re-test

All systems are now production-ready with improved reliability, error handling, and token optimization!


