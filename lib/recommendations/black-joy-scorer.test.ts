import { describe, it, expect } from 'vitest';
import { calculateBlackJoyScore, scoreBooksForBlackJoyQuery } from './black-joy-scorer';
import { BookAnnotation } from '@/types/book-annotations';

describe('Black Joy Scorer', () => {
  // Test Data
  const honeyAndSpice: BookAnnotation = {
    isbn: "111",
    title: "Honey & Spice",
    mainCharacters: [{ name: "Kiki", role: "protagonist", identities: ["Black"] }],
    themes: ["romance", "campus life", "radio", "friendship"],
    traumaTopics: [],
    tone: ["romantic", "humorous", "low-conflict"],
    identityStruggleScore: 1
  };

  const theHateUGive: BookAnnotation = {
    isbn: "222",
    title: "The Hate U Give",
    mainCharacters: [{ name: "Starr", role: "protagonist", identities: ["Black"] }],
    themes: ["activism", "family", "courage"],
    traumaTopics: ["police_violence", "racism", "grief"],
    tone: ["high-stakes", "uplifting"],
    identityStruggleScore: 10
  };

  const legendborn: BookAnnotation = {
    isbn: "333",
    title: "Legendborn",
    mainCharacters: [{ name: "Bree", role: "protagonist", identities: ["Black"] }],
    themes: ["magic", "secret society", "ancestry"],
    traumaTopics: ["grief"],
    tone: ["high-stakes", "dark"],
    identityStruggleScore: 4
  };

  it('should score a perfect match (Honey & Spice) very high', () => {
    const score = calculateBlackJoyScore(honeyAndSpice);
    
    // Calculation breakdown:
    // +100 (Black Protagonist)
    // +30 (3 matching tones: romantic, humorous, low-conflict * 10)
    // +10 (2 matching themes: romance, friendship * 5)
    // = 140
    expect(score).toBeGreaterThan(130);
    expect(score).toBe(140);
  });

  it('should disqualify a book with race-based trauma (The Hate U Give)', () => {
    const score = calculateBlackJoyScore(theHateUGive);
    expect(score).toBe(-1);
  });

  it('should score a dark fantasy with Black MC (Legendborn) moderately', () => {
    const score = calculateBlackJoyScore(legendborn);
    
    // Calculation breakdown:
    // +100 (Black Protagonist)
    // +0 (Tones: high-stakes, dark - neither is preferred)
    // -15 (Dark tone penalty)
    // +5 (Theme: magic)
    // = 90
    expect(score).toBe(90);
    expect(score).toBeLessThan(140); // Should be less than the cozy romance
    expect(score).toBeGreaterThan(0); // But still a valid match
  });

  it('should rank books correctly in a list', () => {
    const library = [legendborn, theHateUGive, honeyAndSpice];
    const ranked = scoreBooksForBlackJoyQuery(library);

    // Should only have 2 results (THUG is disqualified)
    expect(ranked).toHaveLength(2);
    
    // Honey & Spice should be first
    expect(ranked[0].isbn).toBe("111");
    expect(ranked[0].score).toBe(140);
    
    // Legendborn should be second
    expect(ranked[1].isbn).toBe("333");
    expect(ranked[1].score).toBe(90);
  });

  it('should respect strictMode config', () => {
    // If we turn off strict mode, THUG should get a score but a very low one
    const score = calculateBlackJoyScore(theHateUGive, { 
      strictMode: false, 
      allowSideCharacters: false, 
      preferredTones: [] 
    });
    
    // -500 (Trauma penalty) + 100 (Black MC) + ...
    expect(score).toBeLessThan(0);
    expect(score).not.toBe(-1); // -1 is the special disqualifier code
  });
});
