/**
 * Deterministic FAQ Matching Engine for Myco Website Assistant.
 *
 * Provides:
 * - Exact and fuzzy phrase matching
 * - Tokenization and keyword weighting
 * - Ambiguity detection with clarifying question options
 * - Explicit confidence thresholding
 * - Honest fallback triggers for unknown questions
 */
(function (global) {
  'use strict';

  var STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'do', 'does', 'can', 'could',
    'i', 'we', 'you', 'they', 'my', 'our', 'your', 'about', 'please'
  ]);

  function normalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(text) {
    var norm = normalize(text);
    if (!norm) return [];
    var words = norm.split(' ');
    var filtered = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w.length > 1 && !STOP_WORDS.has(w)) {
        filtered.push(w);
      }
    }
    return filtered;
  }

  function stemSimple(word) {
    // Basic English suffix stripping for better match recall
    if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
    if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2);
    if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
    return word;
  }

  function FAQMatcher(faqs, config) {
    this.faqs = faqs || [];
    this.config = config || {};
    this.confidenceThreshold = (this.config.matching && this.config.matching.confidenceThreshold) || 0.58;
    this.ambiguityThreshold = (this.config.matching && this.config.matching.ambiguityThreshold) || 0.38;
    this.maxClarificationOptions = (this.config.matching && this.config.matching.maxClarificationOptions) || 3;
    this.fallbackMessage = (this.config.messages && this.config.messages.fallback) ||
      "I'm not completely sure about that, but our team can help. Would you like us to get back to you?";
  }

  FAQMatcher.prototype.scoreCandidate = function (query, faq) {
    var queryNorm = normalize(query);
    var questionNorm = normalize(faq.question);

    // 1. Exact match check
    if (queryNorm === questionNorm) {
      return 1.0;
    }

    // 2. Exact match against alternate phrasings
    if (faq.alternatePhrasings && faq.alternatePhrasings.length) {
      for (var i = 0; i < faq.alternatePhrasings.length; i++) {
        var altNorm = normalize(faq.alternatePhrasings[i]);
        if (queryNorm === altNorm) {
          return 0.98;
        }
        if (queryNorm.length > 6 && altNorm.length > 6) {
          if (queryNorm.indexOf(altNorm) !== -1 || altNorm.indexOf(queryNorm) !== -1) {
            return 0.90;
          }
        }
      }
    }

    // 3. Substring match on main question
    if (queryNorm.length > 6 && questionNorm.length > 6) {
      if (questionNorm.indexOf(queryNorm) !== -1) {
        return 0.88;
      }
    }

    // 4. Token & Keyword scoring
    var queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return 0.0;
    }

    var queryStems = new Set(queryTokens.map(stemSimple));
    var questionTokens = tokenize(faq.question);
    var questionStems = new Set(questionTokens.map(stemSimple));

    // Compile all target keywords (from keywords, tags, and question tokens)
    var keywordStems = new Set();
    if (faq.keywords) {
      for (var k = 0; k < faq.keywords.length; k++) {
        keywordStems.add(stemSimple(faq.keywords[k].toLowerCase()));
      }
    }
    if (faq.tags) {
      for (var t = 0; t < faq.tags.length; t++) {
        keywordStems.add(stemSimple(faq.tags[t].toLowerCase()));
      }
    }

    var matchedQuestionCount = 0;
    var matchedKeywordCount = 0;

    queryStems.forEach(function (stem) {
      if (questionStems.has(stem)) {
        matchedQuestionCount++;
      }
      if (keywordStems.has(stem)) {
        matchedKeywordCount++;
      }
    });

    var questionCoverage = queryTokens.length > 0 ? (matchedQuestionCount / queryTokens.length) : 0;
    var keywordCoverage = queryTokens.length > 0 ? (matchedKeywordCount / queryTokens.length) : 0;

    // Weighted combined score
    var combinedScore = (questionCoverage * 0.45) + (keywordCoverage * 0.55);

    // Boost if multiple keywords hit
    if (matchedKeywordCount >= 3) {
      combinedScore = Math.min(1.0, combinedScore + 0.15);
    } else if (matchedKeywordCount >= 2) {
      combinedScore = Math.min(1.0, combinedScore + 0.08);
    }

    return Math.round(combinedScore * 100) / 100;
  };

  /**
   * Matches a user query against the FAQ collection.
   *
   * @param {string} query User question text
   * @returns {Object} Match result:
   *   - status: 'CONFIDENT' | 'AMBIGUOUS' | 'UNKNOWN'
   *   - matchedFaq: FAQ object if confident
   *   - answer: string response
   *   - confidence: number
   *   - clarificationOptions: Array<FAQ> if ambiguous
   *   - shouldEscalate: boolean (true if UNKNOWN)
   */
  FAQMatcher.prototype.findAnswer = function (query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        status: 'UNKNOWN',
        matchedFaq: null,
        answer: this.fallbackMessage,
        confidence: 0,
        clarificationOptions: [],
        shouldEscalate: true
      };
    }

    var scored = [];
    for (var i = 0; i < this.faqs.length; i++) {
      var faq = this.faqs[i];
      var score = this.scoreCandidate(query, faq);
      scored.push({ faq: faq, score: score });
    }

    scored.sort(function (a, b) {
      return b.score - a.score;
    });

    var top = scored[0];
    var second = scored.length > 1 ? scored[1] : null;

    // Confident match
    if (top && top.score >= this.confidenceThreshold) {
      // Check if second candidate is extremely close (ambiguity edge case)
      if (second && second.score >= (this.confidenceThreshold - 0.05) && (top.score - second.score) < 0.06) {
        return {
          status: 'AMBIGUOUS',
          matchedFaq: null,
          answer: "Your question could relate to a couple of topics. Please choose the one you mean:",
          confidence: top.score,
          clarificationOptions: [top.faq, second.faq],
          shouldEscalate: false
        };
      }

      return {
        status: 'CONFIDENT',
        matchedFaq: top.faq,
        answer: top.faq.answer,
        confidence: top.score,
        clarificationOptions: [],
        shouldEscalate: false
      };
    }

    // Ambiguous match: candidate score is above ambiguityThreshold
    if (top && top.score >= this.ambiguityThreshold) {
      var options = [];
      for (var j = 0; j < Math.min(this.maxClarificationOptions, scored.length); j++) {
        if (scored[j].score >= (this.ambiguityThreshold - 0.08)) {
          options.push(scored[j].faq);
        }
      }

      return {
        status: 'AMBIGUOUS',
        matchedFaq: null,
        answer: "I found a few topics related to your question. Did you mean one of these?",
        confidence: top.score,
        clarificationOptions: options,
        shouldEscalate: false
      };
    }

    // Low confidence: honest fallback
    return {
      status: 'UNKNOWN',
      matchedFaq: null,
      answer: this.fallbackMessage,
      confidence: top ? top.score : 0,
      clarificationOptions: [],
      shouldEscalate: true
    };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      FAQMatcher: FAQMatcher,
      normalize: normalize,
      tokenize: tokenize,
      stemSimple: stemSimple
    };
  } else {
    global.MycoFaqMatcher = {
      FAQMatcher: FAQMatcher,
      normalize: normalize,
      tokenize: tokenize,
      stemSimple: stemSimple
    };
  }
})(typeof window !== 'undefined' ? window : this);
