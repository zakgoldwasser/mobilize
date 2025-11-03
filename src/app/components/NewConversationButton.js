"use client";

/**
 * Button component to start a new conversation
 * @param {Object} props - Component props
 * @param {Function} props.onNewConversation - Function to handle starting a new conversation
 * @returns {JSX.Element} - The rendered button component
 */
export default function NewConversationButton({ onNewConversation }) {
  return (
    <button
      onClick={onNewConversation}
      className="flex items-center justify-center px-4 py-2 cursor-pointer bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors"
      aria-label="Start new conversation"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      New Conversation
    </button>
  );
}
