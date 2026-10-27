import React, { useState, useEffect, useRef } from "react";
import ChatLauncher from "./ChatLauncher";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    // 2-minute proactive engagement popup logic
    const isDismissed = sessionStorage.getItem("myco_chat_dismissed");
    const isOpened = sessionStorage.getItem("myco_chat_opened");
    if (isDismissed || isOpened) return;

    let elapsed = parseInt(sessionStorage.getItem("myco_chat_active_sec") || "0", 10);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        elapsed += 1;
        sessionStorage.setItem("myco_chat_active_sec", String(elapsed));
        if (elapsed >= 120) {
          setIsOpen(true);
          sessionStorage.setItem("myco_chat_opened", "true");
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      setHasUnread(false);
      sessionStorage.setItem("myco_chat_opened", "true");
    } else {
      setIsOpen(false);
      sessionStorage.setItem("myco_chat_dismissed", "true");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("myco_chat_dismissed", "true");
  };

  return (
    <div className="myco-chat-widget-root">
      <ChatLauncher isOpen={isOpen} hasUnread={hasUnread} onToggle={handleToggle} />
      <ChatPanel
        isOpen={isOpen}
        onClose={handleClose}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}
