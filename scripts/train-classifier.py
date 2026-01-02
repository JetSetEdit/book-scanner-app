#!/usr/bin/env python3
"""
Train Lightweight Content Warning Classifier

Trains a scikit-learn model to predict content warning categories
and severity from book descriptions.

Usage: python scripts/train-classifier.py [training_data.json] [output_model.pkl]
"""

import json
import sys
import pickle
from pathlib import Path
from typing import List, Dict, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import warnings
warnings.filterwarnings('ignore')

# Category mapping (from our taxonomy)
CATEGORIES = [
    'violence',
    'sexual_content',
    'substance_abuse',
    'mental_health',
    'death',
    'abuse',
    'discrimination',
    'other'
]

SEVERITY_LEVELS = ['mild', 'moderate', 'severe']

def load_training_data(file_path: str) -> List[Dict[str, Any]]:
    """Load training data from JSON file."""
    with open(file_path, 'r') as f:
        return json.load(f)

def prepare_features(examples: List[Dict[str, Any]]) -> tuple:
    """
    Prepare features (X) and labels (y) for training.
    
    Features: Book descriptions (text)
    Labels: Multi-label classification
        - Category presence (binary for each category)
        - Severity level (mild/moderate/severe)
    """
    descriptions = []
    category_labels = []  # Multi-label: [violence, sexual_content, ...]
    severity_labels = []  # Multi-class: mild/moderate/severe
    
    for example in examples:
        desc = example.get('description', '')
        if not desc or len(desc) < 50:
            continue  # Skip very short descriptions
        
        descriptions.append(desc)
        
        # Build category presence vector
        categories_present = set()
        severities = []
        
        for warning in example.get('warnings', []):
            cat = warning.get('category_id', '').lower()
            if cat in CATEGORIES:
                categories_present.add(cat)
            
            severity = warning.get('severity', 'mild')
            if severity in SEVERITY_LEVELS:
                severities.append(severity)
        
        # Category labels: binary vector
        cat_vector = [1 if cat in categories_present else 0 for cat in CATEGORIES]
        category_labels.append(cat_vector)
        
        # Severity: use most severe warning
        if severities:
            severity_map = {'mild': 0, 'moderate': 1, 'severe': 2}
            max_severity = max(severities, key=lambda s: severity_map.get(s, 0))
            severity_labels.append(severity_map[max_severity])
        else:
            severity_labels.append(0)  # Default to mild
    
    return descriptions, np.array(category_labels), np.array(severity_labels)

def train_model(X_train, y_categories_train, y_severity_train):
    """Train the classification model."""
    print("🔧 Training models...")
    
    # TF-IDF vectorization
    print("   Vectorizing text...")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),  # Unigrams and bigrams
        min_df=2,  # Word must appear in at least 2 documents
        max_df=0.95,  # Ignore words in >95% of documents
        stop_words='english'
    )
    
    X_train_vec = vectorizer.fit_transform(X_train)
    
    # Category classifier (multi-label)
    print("   Training category classifier...")
    category_classifier = MultiOutputClassifier(
        RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            random_state=42,
            n_jobs=-1
        )
    )
    category_classifier.fit(X_train_vec, y_categories_train)
    
    # Severity classifier (multi-class)
    print("   Training severity classifier...")
    severity_classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )
    severity_classifier.fit(X_train_vec, y_severity_train)
    
    return vectorizer, category_classifier, severity_classifier

def evaluate_model(vectorizer, category_classifier, severity_classifier,
                   X_test, y_categories_test, y_severity_test):
    """Evaluate model performance."""
    print("\n📊 Evaluating model...")
    
    X_test_vec = vectorizer.transform(X_test)
    
    # Category predictions
    y_categories_pred = category_classifier.predict(X_test_vec)
    
    # Severity predictions
    y_severity_pred = severity_classifier.predict(X_test_vec)
    
    # Category accuracy (per-label)
    print("\nCategory Classification (per label):")
    for i, cat in enumerate(CATEGORIES):
        acc = accuracy_score(y_categories_test[:, i], y_categories_pred[:, i])
        print(f"   {cat}: {acc:.3f}")
    
    # Overall category accuracy
    cat_acc = accuracy_score(y_categories_test, y_categories_pred)
    print(f"\n   Overall Category Accuracy: {cat_acc:.3f}")
    
    # Severity accuracy
    sev_acc = accuracy_score(y_severity_test, y_severity_pred)
    print(f"\nSeverity Classification Accuracy: {sev_acc:.3f}")
    
    # Severity classification report
    print("\nSeverity Classification Report:")
    print(classification_report(
        y_severity_test,
        y_severity_pred,
        target_names=SEVERITY_LEVELS
    ))

def predict_example(vectorizer, category_classifier, severity_classifier,
                   description: str) -> Dict[str, Any]:
    """Make predictions for a single example."""
    X_vec = vectorizer.transform([description])
    
    # Category predictions
    category_probs = category_classifier.predict_proba(X_vec)
    category_predictions = category_classifier.predict(X_vec)[0]
    
    # Severity prediction
    severity_pred = severity_classifier.predict(X_vec)[0]
    severity_prob = severity_classifier.predict_proba(X_vec)[0]
    
    # Build result
    categories = {}
    for i, cat in enumerate(CATEGORIES):
        if category_predictions[i] == 1:
            # Get probability from the classifier
            prob = category_probs[i][0][1] if len(category_probs[i][0]) > 1 else 0.5
            categories[cat] = {
                'present': True,
                'confidence': float(prob)
            }
        else:
            categories[cat] = {
                'present': False,
                'confidence': float(category_probs[i][0][0])
            }
    
    return {
        'categories': categories,
        'severity': {
            'level': SEVERITY_LEVELS[severity_pred],
            'confidence': float(severity_prob[severity_pred])
        }
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/train-classifier.py [training_data.json] [output_model.pkl]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'data/models/content_warning_classifier.pkl'
    
    print("🧪 Training Content Warning Classifier\n")
    print(f"📂 Input: {input_file}")
    print(f"💾 Output: {output_file}\n")
    
    # Load data
    print("📚 Loading training data...")
    examples = load_training_data(input_file)
    print(f"   Loaded {len(examples)} examples")
    
    # Prepare features
    print("\n🔧 Preparing features...")
    descriptions, y_categories, y_severity = prepare_features(examples)
    print(f"   Valid examples: {len(descriptions)}")
    print(f"   Categories shape: {y_categories.shape}")
    print(f"   Severity shape: {y_severity.shape}")
    
    if len(descriptions) < 50:
        print("\n⚠️  Warning: Very few training examples. Model may not perform well.")
        print("   Consider collecting more data before training.")
    
    # Split data
    print("\n📊 Splitting data...")
    X_train, X_test, y_cat_train, y_cat_test, y_sev_train, y_sev_test = train_test_split(
        descriptions, y_categories, y_severity,
        test_size=0.2,
        random_state=42
    )
    print(f"   Train: {len(X_train)} examples")
    print(f"   Test: {len(X_test)} examples")
    
    # Train model
    vectorizer, category_classifier, severity_classifier = train_model(
        X_train, y_cat_train, y_sev_train
    )
    
    # Evaluate
    evaluate_model(
        vectorizer, category_classifier, severity_classifier,
        X_test, y_cat_test, y_sev_test
    )
    
    # Save model
    print(f"\n💾 Saving model to {output_file}...")
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    
    model_data = {
        'vectorizer': vectorizer,
        'category_classifier': category_classifier,
        'severity_classifier': severity_classifier,
        'categories': CATEGORIES,
        'severity_levels': SEVERITY_LEVELS
    }
    
    with open(output_file, 'wb') as f:
        pickle.dump(model_data, f)
    
    print("✅ Model saved!")
    
    # Test prediction
    print("\n🧪 Testing prediction on example...")
    if len(X_test) > 0:
        test_desc = X_test[0]
        prediction = predict_example(
            vectorizer, category_classifier, severity_classifier,
            test_desc
        )
        print(f"\nExample description: {test_desc[:100]}...")
        print(f"\nPredicted categories:")
        for cat, info in prediction['categories'].items():
            if info['present']:
                print(f"   {cat}: {info['confidence']:.3f}")
        print(f"\nPredicted severity: {prediction['severity']['level']} ({prediction['severity']['confidence']:.3f})")
    
    print("\n✅ Training complete!")
    print(f"\nNext steps:")
    print(f"   1. Test model with: python scripts/test-classifier.py {output_file}")
    print(f"   2. Integrate into analysis pipeline")

if __name__ == '__main__':
    main()

