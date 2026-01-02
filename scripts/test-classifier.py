#!/usr/bin/env python3
"""
Test Content Warning Classifier

Tests the trained classifier on new examples.

Usage: python scripts/test-classifier.py [model.pkl] [description_text]
"""

import sys
import pickle
import json

def load_model(file_path: str):
    """Load the trained model."""
    with open(file_path, 'rb') as f:
        return pickle.load(f)

def predict(model_data, description: str):
    """Make predictions for a description."""
    vectorizer = model_data['vectorizer']
    category_classifier = model_data['category_classifier']
    severity_classifier = model_data['severity_classifier']
    categories = model_data['categories']
    severity_levels = model_data['severity_levels']
    
    # Vectorize
    X_vec = vectorizer.transform([description])
    
    # Category predictions
    category_probs = category_classifier.predict_proba(X_vec)
    category_preds = category_classifier.predict(X_vec)[0]
    
    # Severity prediction
    severity_pred = severity_classifier.predict(X_vec)[0]
    severity_probs = severity_classifier.predict_proba(X_vec)[0]
    
    # Build results
    result = {
        'categories': {},
        'severity': {
            'predicted': severity_levels[severity_pred],
            'probabilities': {}
        }
    }
    
    for i, cat in enumerate(categories):
        present = bool(category_preds[i] == 1)
        prob = category_probs[i][0][1] if len(category_probs[i][0]) > 1 else 0.0
        
        result['categories'][cat] = {
            'present': present,
            'confidence': float(prob)
        }
    
    for i, level in enumerate(severity_levels):
        result['severity']['probabilities'][level] = float(severity_probs[i])
    
    return result

def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/test-classifier.py [model.pkl] [description_text]")
        sys.exit(1)
    
    model_file = sys.argv[1]
    description = sys.argv[2]
    
    print("🧪 Testing Classifier\n")
    print(f"📂 Model: {model_file}")
    print(f"📝 Description: {description[:200]}...\n")
    
    # Load model
    print("📚 Loading model...")
    model_data = load_model(model_file)
    print("✅ Model loaded\n")
    
    # Predict
    print("🔮 Making predictions...\n")
    result = predict(model_data, description)
    
    # Display results
    print("📊 PREDICTIONS\n")
    print("Categories:")
    for cat, info in result['categories'].items():
        if info['present']:
            print(f"   ✅ {cat}: {info['confidence']:.3f}")
        elif info['confidence'] > 0.3:  # Show high-confidence negatives
            print(f"   ❌ {cat}: {info['confidence']:.3f}")
    
    print(f"\nSeverity: {result['severity']['predicted']}")
    print("Severity Probabilities:")
    for level, prob in result['severity']['probabilities'].items():
        marker = "👉" if level == result['severity']['predicted'] else "  "
        print(f"   {marker} {level}: {prob:.3f}")
    
    # JSON output
    print("\n📄 JSON Output:")
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()

