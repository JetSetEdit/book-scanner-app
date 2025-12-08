import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
import numpy as np

def load_and_train(csv_path):
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Simple training wrapper
    # In a real scenario with more data, we'd have a classifier for each category
    # For this single-row prototype, we'll simulate the "inference" by creating 
    # a pipeline that learns the vocabulary and maps it to the tags.
    # Since we can't really "train" a classifier on one sample to predict unseen classes significantly,
    # we will build a heuristic feature extractor + lookup for this demo to show structure.
    
    # However, to strictly follow the prompt's "TF-IDF + Naive Bayes" request:
    # We will treat the categories as separate targets.
    
    # Let's target 'violence' as the primary demo target to show the logic.
    # We'll duplicate the row to pretend we have a 'dataset' just to make sklearn happy if needed,
    # but strictly speaking, fit() works on 1 sample.
    
    X = df['blurb']
    
    models = {}
    target_columns = ['violence', 'sexual_content', 'emotional_abuse', 'mental_health', 'discrimination']
    
    print("\nTraining models on annotated data...")
    for col in target_columns:
        # Extract the intensity label (before the |)
        y = df[col].apply(lambda x: x.split('|')[0] if isinstance(x, str) else 'none')
        
        # Create a pipeline
        model = make_pipeline(TfidfVectorizer(stop_words='english'), MultinomialNB())
        model.fit(X, y)
        models[col] = model
        print(f" - Trained model for '{col}'")
        
    return models, df

def analyze_blurb(models, blurb_text, genre):
    print(f"\nAnalyzing new blurb (Genre: {genre})...")
    # print(f"Text snippet: {blurb_text[:100]}...")
    
    results = {}
    
    # 1. Base Model Prediction
    for cat, model in models.items():
        base_pred = model.predict([blurb_text])[0]
        results[cat] = {
            'intensity': base_pred,
            'source': 'model_inference'
        }
        
    # 2. Genre-Heuristic Layer (The "Strict" Logic)
    # This overrides or bumps validation based on keywords/genre
    # This is critical because the single-row model is very overfit.
    
    if genre.lower() == 'adult_fantasy':
        # Rule: Adult fantasy often implies higher stakes violence/sex than YA
        if 'romance' in blurb_text.lower():
            current = results['sexual_content']['intensity']
            if current in ['low', 'none', 'moderate']:
                 results['sexual_content']['intensity'] = 'moderate-high'
                 results['sexual_content']['rationale'] = 'Genre (Adult Fantasy) + "romance" keyword implies potential explicit dynamics.'
        
        if 'police' in blurb_text.lower() or 'famine' in blurb_text.lower():
             results['violence']['intensity'] = 'high'
             results['violence']['rationale'] = 'Genre (Adult Fantasy) + "police/famine" keywords implies systemic brutality.'
             
    return results

if __name__ == "__main__":
    csv_file = "wicked_annotation.csv"
    
    try:
        models, df = load_and_train(csv_file)
        
        # Test on the *same* blurb to verify it strictly captures the "Wicked" nuances 
        # (simulating it as a 'new' scan of the same book to see if rules clarify it)
        test_blurb = df.iloc[0]['blurb']
        test_genre = "adult_fantasy"
        
        analysis = analyze_blurb(models, test_blurb, test_genre)
        
        print("\n=== AI Analysis Result (Strict Mode) ===")
        print(f"Book: Wicked (Test Scan)")
        for category, data in analysis.items():
            print(f"\nCategory: {category.upper()}")
            print(f"  Intensity: {data['intensity']}")
            if 'rationale' in data:
                print(f"  Rationale: {data['rationale']}")
            else:
                print(f"  Rationale: Model confidence based on training data features.")
                
    except Exception as e:
        print(f"Error: {e}")
