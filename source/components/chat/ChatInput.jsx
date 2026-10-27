import React, { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <footer className="myco-chat-footer">
      <form onSubmit={handleSubmit} className="myco-chat-input-wrapper">
        <textarea
          id="myco-chat-input"
          className="myco-chat-input"
          placeholder="Ask Myco Assistant a question..."
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Type your message"
          disabled={disabled}
        />
        <button
          type="submit"
          id="myco-chat-btn-send"
          className="myco-chat-btn-send"
          aria-label="Send message"
          disabled={!text.trim() || disabled}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
      <p className="myco-chat-footer__subtext">Myco Assistant can make mistakes. Check important info.</p>
    </footer>
  );
}
