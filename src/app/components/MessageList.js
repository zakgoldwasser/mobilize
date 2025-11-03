"use client";

import { useRef, useEffect } from "react";
import Message from "./Message";
import SuggestedMessages from "./SuggestedMessages";

/**
 * MessageList component to display a list of chat messages
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects
 * @param {Object} props.fileCitations - Object mapping message indices to file citations
 * @param {Function} props.onMessageSubmit - Function to handle message submission
 * @param {boolean} props.isSubmitting - Whether a message is currently being submitted
 * @returns {JSX.Element} - The rendered message list component
 */
export default function MessageList({
  messages,
  fileCitations,
  onMessageSubmit,
  isSubmitting,
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 flex flex-col">
      {messages.length === 0 && (
        <div className="flex items-center justify-center mt-auto mb-0">
          <SuggestedMessages onMessageSelect={onMessageSubmit} />
        </div>
      )}

      {messages.map((message, index) => (
        <Message
          key={`message-${index}`}
          message={message}
          citations={fileCitations[index] || []}
          isStreaming={
            isSubmitting &&
            index === messages.length - 1 &&
            message.role === "assistant"
          }
        />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
