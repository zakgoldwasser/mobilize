"use client";

/**
 * SuggestedMessages component to display message suggestion buttons
 * @param {Object} props - Component props
 * @param {Function} props.onMessageSelect - Function to handle message selection
 * @returns {JSX.Element} - The rendered suggested messages component
 */
export default function SuggestedMessages({ onMessageSelect }) {
  // Array of suggested messages
  const suggestions = [
    "Find volunteer oppurtunities in MD",
    "Events for water quality",
    "Find environmental petitions",
    "Protests in CA",
    "Virtual events for immigrants rights",
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-3 w-full mx-auto">
      <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        Start with a suggestion
      </h3>
      <div className="flex flex-wrap gap-3 w-full justify-center">
        {suggestions.map((suggestion, index) => (
          <button
            key={`suggestion-${index}`}
            onClick={() => onMessageSelect(suggestion)}
            className="cursor-pointer px-5 py-2 text-left bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors duration-200 text-zinc-700 dark:text-zinc-300"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <p className="text-base mt-4 text-zinc-500 dark:text-zinc-400">
        Or type your own message
      </p>
    </div>
  );
}
