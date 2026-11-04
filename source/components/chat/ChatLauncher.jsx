import React, { useState, useEffect } from "react";

const PHRASES = [
  "Hi, I'm Myco Assistant! Ask me anything 👋",
  "Compare Myco with CodeRabbit, Graptile, and CodeAnt ✨",
  "Ask about context-first PR reviews, security, and pilots 🚀",
];

export default function ChatLauncher({ isOpen, hasUnread, onToggle }) {
  const [typedText, setTypedText] = useState("");
  const [showCallout, setShowCallout] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isOpen || isDismissed) {
      setShowCallout(false);
      return;
    }

    // Proactively show typewriter on landing after 800ms
    const timer = setTimeout(() => {
      setShowCallout(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [isOpen, isDismissed]);

  useEffect(() => {
    if (!showCallout || isOpen || isDismissed) return;

    let phraseIdx = 0;
    let charIdx = 0;
    let timeoutId;

    const typeChar = () => {
      const currentPhrase = PHRASES[phraseIdx % PHRASES.length];
      if (charIdx <= currentPhrase.length) {
        setTypedText(currentPhrase.slice(0, charIdx));
        charIdx++;
        timeoutId = setTimeout(typeChar, 40);
      } else {
        timeoutId = setTimeout(() => {
          phraseIdx++;
          charIdx = 0;
          typeChar();
        }, 4500);
      }
    };

    typeChar();

    return () => clearTimeout(timeoutId);
  }, [showCallout, isOpen, isDismissed]);

  const handleMouseEnter = () => {
    if (!isOpen && !isDismissed) {
      setShowCallout(true);
    }
  };

  const handleDismissCallout = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    setShowCallout(false);
  };

  return (
    <>
      {!isOpen && showCallout && (
        <div
          className="myco-chat-callout is-visible"
          onClick={onToggle}
          onMouseEnter={handleMouseEnter}
          role="status"
          aria-live="polite"
          title="Click to chat with Myco Assistant"
        >
          <span className="myco-chat-callout__avatar" aria-hidden="true">
            <img src="assets/myco-icon.svg" alt="Myco Assistant avatar" />
          </span>
          <div className="myco-chat-callout__content">
            <div className="myco-chat-callout__header">
              <span className="myco-chat-callout__name">Myco Assistant</span>
            </div>
            <div className="myco-chat-callout__text-line">
              <span className="myco-typewriter-text">{typedText}</span>
              <span className="myco-typewriter-cursor" aria-hidden="true">|</span>
            </div>
          </div>
          <button
            type="button"
            className="myco-chat-callout__close"
            onClick={handleDismissCallout}
            title="Dismiss message"
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <button
        type="button"
        className="myco-chat-launcher"
        onClick={onToggle}
        onMouseEnter={handleMouseEnter}
        aria-label={isOpen ? "Close Myco Assistant" : "Open Myco Assistant"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="myco-chat-panel"
      >
        {!isOpen ? (
          <span className="myco-chat-launcher__icon-open" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
        ) : (
          <span className="myco-chat-launcher__icon-close" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        )}
        {!isOpen && hasUnread && <span className="myco-chat-launcher__ping" aria-hidden="true"></span>}
      </button>
    </>
  );
}
