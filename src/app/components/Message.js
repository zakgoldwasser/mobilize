"use client";

import CitationCarousel from "./CitationCarousel";

/**
 * Format text by converting **text** to bold text
 * @param {string} text - The text to format
 * @returns {JSX.Element[]} - Array of formatted text elements
 */
function formatText(text) {
  if (!text) return [];

  // Split the text by ** markers
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    // Check if this part is surrounded by ** markers
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      // Remove the ** markers and return as bold
      const boldText = part.slice(2, -2);
      return <strong key={index}>{boldText}</strong>;
    }
    // Return regular text
    return <span key={index}>{part}</span>;
  });
}

/**
 * Message component to display a chat message
 * @param {Object} props - Component props
 * @param {Object} props.message - The message object with role and content
 * @param {Array} props.citations - Array of file citations for this message
 * @param {boolean} props.isStreaming - Whether the message is currently streaming
 * @returns {JSX.Element} - The rendered message component
 */
export default function Message({
  message,
  citations = [],
  isStreaming = false,
}) {
  const isUser = message.role === "user";
  const formattedContent = formatText(message.content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] min-w-[10%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-800"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{formattedContent}</p>
        {!isUser && citations && citations.length > 0 && !isStreaming && (
          <CitationCarousel citations={citations} />
        )}
      </div>
    </div>
  );
}
