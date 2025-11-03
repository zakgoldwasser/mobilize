"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStream } from "./hooks/useChatStream";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import NewConversationButton from "./components/NewConversationButton";
import ProjectDetails from "./components/ProjectDetails";

/**
 * Main chat application page component
 * @returns {JSX.Element} - The rendered page component
 */
export default function Home() {
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const detailsRef = useRef(null);

  const {
    messages,
    isSubmitting,
    fileCitations,
    submitMessage,
    startNewConversation,
  } = useChatStream();

  // Auto-scroll to project details when panel is opened
  useEffect(() => {
    if (showProjectDetails && detailsRef.current) {
      setTimeout(() => {
        detailsRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [showProjectDetails]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col bg-white dark:bg-black relative">
        {/* Project Details Tab Button */}
        <div className="fixed right-0 top-1/2 transform translate-x-1/4 -translate-y-1/2 z-20">
          <button
            onClick={() => setShowProjectDetails(!showProjectDetails)}
            className="bg-zinc-600 hover:bg-zinc-500 text-white p-2 rounded-t-md shadow-md transition-colors duration-200 -rotate-90 cursor-pointer"
            aria-label={
              showProjectDetails
                ? "Hide project details"
                : "Show project details"
            }
          >
            <div className="flex items-center">
              <span className="transform  text-sm font-medium text-white">
                {showProjectDetails ? "Hide Details" : "Project Details"}
              </span>
            </div>
          </button>
        </div>

        {/* Header with New Conversation Button */}
        <div className="sticky top-0 z-10 flex justify-end items-center p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
          <NewConversationButton onNewConversation={startNewConversation} />
        </div>

        {/* Chat Messages Area */}
        <MessageList
          messages={messages}
          fileCitations={fileCitations}
          onMessageSubmit={submitMessage}
          isSubmitting={isSubmitting}
        />

        {/* Input Area */}
        <ChatInput onSubmit={submitMessage} isSubmitting={isSubmitting} />
      </main>
      {/* Project Details Area - conditionally rendered */}
      {showProjectDetails && (
        <div className="w-full mt-16" ref={detailsRef}>
          <ProjectDetails />
        </div>
      )}
    </div>
  );
}
