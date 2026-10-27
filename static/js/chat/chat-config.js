/**
 * Configuration for Myco Assistant — Production-Ready RAG AI Chatbot.
 *
 * Controls branding, endpoints, automatic engagement, typewriter phrasing,
 * and starter suggestions.
 */
(function (global) {
  'use strict';

  var ChatConfig = {
    // Identity & Branding
    assistantName: 'Myco Assistant',
    assistantAvatar: 'assets/myco-icon.svg',
    assistantAvatarFallback: 'assets/myco-icon.png',

    // Typewriter greeting callout
    typewriter: {
      enabled: true,
      phrases: [
        "Hi, I'm Myco Assistant! Ask me anything 👋",
        "Compare Myco with CodeRabbit, Graptile, and CodeAnt ✨",
        "Ask about context-first PR reviews, security, and pilots 🚀"
      ],
      typingSpeedMs: 40,
      backspaceSpeedMs: 22,
      holdDurationMs: 4500,
      initialDelayMs: 800
    },

    // Proactive engagement & auto-popup
    autoPopup: {
      enabled: true,
      delaySeconds: 120, // 2 minutes of active browsing
      respectDismissal: true,
      onlyWhenTabActive: true,
    },

    // Session persistence keys (scoped to current browser session)
    storageKeys: {
      opened: 'myco_chat_opened',
      dismissed: 'myco_chat_dismissed',
      activeSeconds: 'myco_chat_active_sec',
      history: 'myco_chat_history_v2',
    },

    // Endpoints
    askEndpoint: '/api/chat/ask',
    escalationEndpoint: '/api/chat/escalations',

    // Matching engine parameters (used for fallback or offline)
    matching: {
      confidenceThreshold: 0.58,
      ambiguityThreshold: 0.38,
      maxClarificationOptions: 3,
    },

    // Default messages
    messages: {
      greeting: "Hi there! 👋 I'm **Myco Assistant**. How can I help you today?",
      inputPlaceholder: "Ask Myco Assistant a question...",
      fallback: "I’m sorry, but I don’t have enough verified information to answer that question accurately. Please contact the Myco team for further assistance.",
      confidentialRefusal: "I can help explain Myco’s publicly documented features and capabilities, but I can’t share confidential implementation details or internal system architecture.",
      clarificationPrefix: "I found a few relevant topics from our verified documentation. Did you mean one of these?",
      leadSuccess: "Thank you! Your inquiry and conversation context have been forwarded to our engineering team. We'll follow up shortly.",
      leadError: "We couldn't submit your inquiry right now. Please try again or reach out to us at pilot@mycointelligence.com.",
    },

    // Suggested questions displayed on initial greeting
    starterQuestions: [
      "What is Myco and how does context-first analysis work?",
      "Compare Myco with CodeRabbit, Graptile, and CodeAnt",
      "What is Myco's zero model training policy for customer code?",
      "How do 14-day production pilots work?",
      "Which programming languages and CI/CD tools are supported?",
      "What is Myco's pricing and deployment model?",
    ],
  };

  global.MycoChatConfig = ChatConfig;
})(typeof window !== 'undefined' ? window : this);
