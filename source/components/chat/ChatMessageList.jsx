import React, { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import SuggestedQuestions from "./SuggestedQuestions";
import LeadCaptureForm from "./LeadCaptureForm";

export default function ChatMessageList({
  messages,
  isTyping,
  onSelectQuestion,
  pendingEscalationQuestion,
  onClearEscalation,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping, pendingEscalationQuestion]);

  return (
    <div
      ref={containerRef}
      className="myco-chat-messages"
      id="myco-chat-messages-container"
      role="log"
      aria-live="polite"
    >
      <div className="myco-chat-welcome">
        <span className="myco-chat-welcome__badge">Myco Assistant</span>
        <p><strong>Hi there! 👋 I'm Myco Assistant. How can I help you today?</strong></p>
        <SuggestedQuestions onSelect={onSelectQuestion} />
      </div>

      {messages.map((msg, idx) => (
        <ChatMessage
          key={idx}
          sender={msg.sender}
          text={msg.text}
          time={msg.time}
          clarifications={msg.clarifications}
          onSelectQuestion={onSelectQuestion}
        />
      ))}

      {isTyping && (
        <div className="myco-chat-typing">
          <span className="myco-chat-typing__dot"></span>
          <span className="myco-chat-typing__dot"></span>
          <span className="myco-chat-typing__dot"></span>
        </div>
      )}

      {pendingEscalationQuestion && (
        <LeadCaptureForm
          prefilledQuestion={pendingEscalationQuestion}
          onDismiss={onClearEscalation}
          conversationContext={messages.slice(-6)}
        />
      )}
    </div>
  );
}
