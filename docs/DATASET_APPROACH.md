# Dataset Integration Approach

## Recommendation: Example Augmentation (Not Fine-Tuning)

Based on our current architecture, I recommend **example augmentation** rather than fine-tuning:

### Why Example Augmentation?

1. **No Infrastructure Changes**: Works with current prompt-based approach
2. **Incremental Improvement**: Can add examples gradually
3. **Maintains Flexibility**: Easy to update/remove examples
4. **Cost Effective**: No fine-tuning costs
5. **Transparency**: Examples are visible and reviewable

### Why Not Fine-Tuning (Yet)?

1. **Cost**: Fine-tuning GPT-4o is expensive (~$3-8 per 1K examples)
2. **Maintenance**: Need to retrain when guidelines change
3. **Flexibility**: Harder to adjust behavior quickly
4. **Current Performance**: Prompt-based approach is working well

### Hybrid Approach (Future)

Consider fine-tuning if:
- We have 10,000+ high-quality examples
- We need faster inference (cost reduction)
- We want to reduce API dependency

## Implementation Plan

### Phase 1: Dataset Exploration ✅
- [x] Create exploration script
- [ ] Test with Surge AI Toxicity (small, clean)
- [ ] Test with OpenAI Moderation examples

### Phase 2: Example Conversion
- [ ] Convert dataset examples to book-description format
- [ ] Map categories to our taxonomy
- [ ] Add to `training-examples.ts`

### Phase 3: Integration
- [ ] Update prompts to reference examples
- [ ] Test improvement
- [ ] Measure accuracy gains

### Phase 4: Database Storage (Optional)
- [ ] Store patterns for validation
- [ ] Pattern matching for edge cases

## Quick Start

```bash
# Explore a dataset
tsx scripts/explore-moderation-datasets.ts surge-toxicity

# Review converted examples
cat data/datasets/surge-toxicity/sample_conversions.json

# Add to training examples (manual review first)
# Then add to lib/training-examples.ts
```

## Key Insight

The Publications Guidelines already provide a strong framework. Datasets help us:
1. **Cover edge cases** we haven't seen
2. **Validate our taxonomy** mapping
3. **Improve consistency** across similar content
4. **Add implicit patterns** (e.g., subtle hate speech)

But we should **adapt** datasets to book context, not use them directly.


