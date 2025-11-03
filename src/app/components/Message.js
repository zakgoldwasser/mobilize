"use client";

import CitationCarousel from "./CitationCarousel";

/**
 * Message component to display a chat message
 * @param {Object} props - Component props
 * @param {Object} props.message - The message object with role and content
 * @param {Array} props.citations - Array of file citations for this message
 * @returns {JSX.Element} - The rendered message component
 */
export default function Message({ message, citations = [] }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] min-w-[10%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-800"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {!isUser && citations && citations.length > 0 && (
          <CitationCarousel citations={citations} />
        )}
      </div>
    </div>
  );
}
