import React from "react";

const STARTER_QUESTIONS = [
  "What is Myco and how does context-first analysis work?",
  "Compare Myco with CodeRabbit, Graptile, and CodeAnt",
  "What is Myco's zero model training policy for customer code?",
  "How do 14-day production pilots work?",
  "Which programming languages and CI/CD tools are supported?",
  "What is Myco's pricing and deployment model?",
];

export default function SuggestedQuestions({ onSelect }) {
  return (
    <div className="myco-chat-suggestions">
      <span className="myco-chat-suggestions__label">Suggested questions:</span>
      {STARTER_QUESTIONS.map((q, idx) => (
        <button
          key={idx}
          type="button"
          className="myco-chat-pill"
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
