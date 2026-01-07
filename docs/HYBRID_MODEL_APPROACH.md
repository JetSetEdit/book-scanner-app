# Hybrid Model Approach: Lightweight Classifier + LLM

## Concept

Train a lightweight classification model to predict content warning categories and severity as "priors", then use the LLM to refine and contextualize these predictions.

## Why This Could Be Valuable

### Current Approach (LLM-Only)
- ✅ High quality, contextual understanding
- ✅ Handles nuance and edge cases
- ❌ Expensive (API costs per book)
- ❌ Slow (API latency)
- ❌ No learning from past examples

### Hybrid Approach (Classifier + LLM)
- ✅ Fast initial predictions (local inference)
- ✅ Lower cost (only refine with LLM when needed)
- ✅ Learns from training data
- ✅ Can provide priors to LLM for better results
- ⚠️ Requires training data and model maintenance

## Proposed Architecture

```
Book Description
    ↓
[Lightweight Classifier] → Predictions (categories, severity)
    ↓
[LLM Refinement] → Final warnings with context
```

### Stage 1: Lightweight Classifier (Local)
- **Input**: Book description text
- **Output**: 
  - Category probabilities (violence, sexual_content, etc.)
  - Severity estimates (mild/moderate/severe)
  - Confidence scores
- **Model**: Lightweight (can run on CPU/consumer GPU)

### Stage 2: LLM Refinement (API)
- **Input**: Description + classifier predictions
- **Output**: Refined warnings with context, reasoning
- **Benefit**: LLM can focus on refinement rather than discovery

## Model Options for Existing Hardware

### Option 1: Scikit-learn Pipeline (CPU-Friendly) ✅ RECOMMENDED

**Model**: TF-IDF + Logistic Regression / Random Forest
- **Hardware**: CPU only, very fast
- **Training**: Minutes on consumer hardware
- **Inference**: < 10ms per book
- **Size**: < 10MB

**Pros**:
- Runs on any hardware
- Fast training and inference
- Interpretable
- Easy to update

**Cons**:
- Less sophisticated than neural networks
- May miss complex patterns

**Implementation**:
```python
# Pseudo-code
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier

# Multi-label classification
# Labels: [violence, sexual_content, language, abuse, ...]
# Severity: [mild, moderate, severe]
```

### Option 2: Lightweight Neural Network (GPU-Optional)

**Model**: Small BERT or DistilBERT
- **Hardware**: CPU (slow) or GPU (fast)
- **Training**: Hours on consumer GPU, days on CPU
- **Inference**: 50-200ms on CPU, 10-50ms on GPU
- **Size**: 50-250MB

**Pros**:
- Better understanding of context
- Can capture complex patterns
- State-of-the-art performance

**Cons**:
- Requires more training data
- Slower on CPU
- Larger model size

### Option 3: Hybrid: Keyword Features + Simple ML

**Model**: Pattern matching + Logistic Regression
- **Hardware**: CPU only
- **Training**: Minutes
- **Inference**: < 5ms
- **Size**: < 5MB

**Pros**:
- Very fast
- Interpretable
- Can leverage our existing pattern-mapping logic
- Easy to maintain

**Cons**:
- Less flexible than full ML models

## Training Data Sources

### 1. Our Own Analyzed Books ✅
- Books we've already analyzed with LLM
- High quality, already labeled
- Grows over time

### 2. goodbooks-10k + Enrichment ✅
- Metadata from goodbooks-10k (CC BY-SA 4.0)
- Enriched with API descriptions
- Analyzed through our pipeline
- Creates labeled training data

### 3. Toxicity Dataset Conversions ✅
- Converted moderation examples
- Pattern-mapped to our taxonomy
- Good for edge cases

### 4. Manual Labeling (Future)
- Curated examples
- Edge cases
- Quality control

## Integration Strategy

### Phase 1: Train Baseline Model
1. Collect training data (100-500 examples)
2. Train scikit-learn classifier
3. Test accuracy on held-out set
4. Deploy as "prior generator"

### Phase 2: Integrate with LLM
1. Modify LLM prompt to include classifier predictions
2. LLM refines/validates predictions
3. Compare results: classifier-only vs hybrid vs LLM-only

### Phase 3: Iterative Improvement
1. Use LLM outputs to improve classifier
2. Retrain periodically with new data
3. A/B test hybrid vs LLM-only

## Example Integration

### Current LLM Prompt
```
Analyze this book for content warnings...
[Full description]
```

### Hybrid Prompt
```
Analyze this book for content warnings...

Initial predictions from classifier:
- Violence: 0.85 (severe)
- Sexual content: 0.42 (moderate)
- Language: 0.23 (mild)

Book description:
[Full description]

Please refine these predictions, add context, and provide reasoning.
```

## Benefits

1. **Cost Reduction**: Only use LLM for refinement, not discovery
2. **Speed**: Fast initial predictions
3. **Learning**: Model improves with more data
4. **Consistency**: More consistent baseline predictions
5. **Scalability**: Can handle high volume locally

## Challenges

1. **Training Data**: Need sufficient labeled examples
2. **Model Maintenance**: Retrain periodically
3. **Integration**: Seamless handoff to LLM
4. **Quality**: Ensure classifier doesn't introduce bias

## Recommended Approach

### Start Simple: Scikit-learn Pipeline

**Why**:
- Runs on any hardware (CPU-only)
- Fast to train and deploy
- Easy to interpret and debug
- Can start with 100-200 examples

**Implementation Plan**:
1. Collect 200-500 training examples
2. Train multi-label classifier (categories + severity)
3. Integrate as "prior generator"
4. Modify LLM prompt to use priors
5. Measure improvement

### Future: Lightweight Neural Network

**When to Consider**:
- Have 1000+ training examples
- Need better accuracy
- Have GPU available
- Want more sophisticated patterns

## Code Structure

```
lib/
  models/
    classifier.ts          # Model interface
    train-classifier.ts    # Training script
    predict.ts             # Inference
  services/
    hybrid-analysis.ts     # Combines classifier + LLM
```

## Implementation Steps

### Step 1: Export Training Data

```bash
# Export books with warnings from database
tsx scripts/export-training-data.ts
```

This creates `data/training/exported_training_data.json` with:
- Book descriptions
- Content warning categories
- Severity levels

### Step 2: Train Model

```bash
# Train scikit-learn classifier
python scripts/train-classifier.py \
  data/training/exported_training_data.json \
  data/models/content_warning_classifier.pkl
```

This will:
- Vectorize descriptions (TF-IDF)
- Train category classifier (multi-label)
- Train severity classifier (multi-class)
- Evaluate on test set
- Save model to pickle file

### Step 3: Test Model

```bash
# Test on a description
python scripts/test-classifier.py \
  data/models/content_warning_classifier.pkl \
  "A dark romance novel with themes of abuse and violence..."
```

### Step 4: Integrate with LLM

1. Create TypeScript wrapper to call Python model
2. Modify `multi-model-analysis.ts` to:
   - Run classifier first (get priors)
   - Include priors in LLM prompt
   - LLM refines predictions

### Step 5: Iterate

- Collect more training data
- Retrain periodically
- A/B test hybrid vs LLM-only
- Monitor quality metrics

## Hardware Requirements

### Minimum (Scikit-learn)
- **CPU**: Any modern CPU
- **RAM**: 4GB+ (for training), 1GB (for inference)
- **Storage**: < 100MB for model
- **Training Time**: 5-30 minutes
- **Inference**: < 10ms per book

### Recommended (Lightweight Neural)
- **CPU**: Modern multi-core
- **GPU**: Optional but recommended (NVIDIA with 4GB+ VRAM)
- **RAM**: 8GB+
- **Storage**: 500MB for model
- **Training Time**: 1-4 hours (GPU) or 8-24 hours (CPU)
- **Inference**: 10-50ms (GPU) or 50-200ms (CPU)

## Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install -r requirements-ml.txt
```

### Step 1: Export Training Data

```bash
# Export books with warnings from your database
tsx scripts/export-training-data.ts
```

This creates `data/training/exported_training_data.json`.

### Step 2: Train Model

```bash
# Train the classifier
python scripts/train-classifier.py \
  data/training/exported_training_data.json \
  data/models/content_warning_classifier.pkl
```

### Step 3: Test Model

```bash
# Test on a sample description
python scripts/test-classifier.py \
  data/models/content_warning_classifier.pkl \
  "A dark romance novel with themes of abuse and violence..."
```

### Step 4: Integrate (Future)

Once validated, integrate into the analysis pipeline:
1. Create TypeScript wrapper for Python model
2. Modify `multi-model-analysis.ts` to use classifier priors
3. A/B test hybrid vs LLM-only

## Conclusion

A lightweight classifier as a "prior generator" could be valuable:
- ✅ Reduces LLM costs
- ✅ Improves speed
- ✅ Learns from data
- ✅ Works on existing hardware (scikit-learn)

**Recommendation**: Start with scikit-learn pipeline, validate with 200-500 examples, then consider neural network if needed.

**Status**: Scripts ready. Export training data and train model to begin validation.

