"use client";

import { useState } from "react";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";

/**
 * ChatInput component for user message input
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Function to call when submitting a message
 * @param {boolean} props.isSubmitting - Whether a submission is in progress
 * @returns {JSX.Element} - The rendered chat input component
 */
export default function ChatInput({ onSubmit, isSubmitting }) {
  const [input, setInput] = useState("");
  const textareaRef = useAutoResizeTextarea(input);

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!input.trim() || isSubmitting) return;
    
    const message = input.trim();
    setInput("");
    onSubmit(message);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none text-sm max-h-32 overflow-y-auto"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="absolute right-2 bottom-2 flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-600 transition-colors"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
