import React, { useState, useRef, useEffect } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import LeadCaptureForm from "./LeadCaptureForm";

export default function ChatPanel({ isOpen, onClose, messages, setMessages }) {
  const [isTyping, setIsTyping] = useState(false);
  const [pendingEscalationQuestion, setPendingEscalationQuestion] = useState(null);

  const handleSendMessage = (text) => {
    const userMsg = { sender: "user", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      // Fallback/FAQ matching handler
      const matcher = window.MycoFaqMatcher ? new window.MycoFaqMatcher.FAQMatcher(window.MycoChatFaqs, window.MycoChatConfig) : null;
      if (matcher) {
        const result = matcher.findAnswer(text);
        if (result.status === "CONFIDENT") {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: result.answer, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
          ]);
        } else if (result.status === "AMBIGUOUS") {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: result.answer,
              clarifications: result.clarificationOptions,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: result.answer, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
          ]);
          setPendingEscalationQuestion(text);
        }
      }
    }, 400);
  };

  const handleReset = () => {
    setMessages([]);
    setPendingEscalationQuestion(null);
  };

  return (
    <section
      id="myco-chat-panel"
      className={`myco-chat-panel ${isOpen ? "is-open" : ""}`}
      role="dialog"
      aria-label="Myco Assistant — AI Assistant"
      aria-hidden={!isOpen}
    >
      <header className="myco-chat-header">
        <div className="myco-chat-header__info">
          <div className="myco-chat-header__avatar">
            <img src="assets/myco-icon.svg" onError={(e) => { e.currentTarget.src = "assets/myco-icon.png"; }} alt="Myco Assistant Avatar" />
            <span className="myco-chat-header__status-dot" aria-label="Online"></span>
          </div>
          <div className="myco-chat-header__details">
            <h3>Myco Assistant</h3>
          </div>
        </div>
        <div className="myco-chat-header__actions">
          <button type="button" className="myco-chat-header__btn" onClick={handleReset} title="Reset conversation" aria-label="Reset conversation">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          </button>
          <button type="button" className="myco-chat-header__btn" onClick={onClose} title="Close assistant" aria-label="Close assistant">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <ChatMessageList
        messages={messages}
        isTyping={isTyping}
        onSelectQuestion={handleSendMessage}
        pendingEscalationQuestion={pendingEscalationQuestion}
        onClearEscalation={() => setPendingEscalationQuestion(null)}
      />

      <ChatInput onSend={handleSendMessage} disabled={isTyping} />
    </section>
  );
}
