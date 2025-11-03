"use client";

import { useChatStream } from "./hooks/useChatStream";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";

/**
 * Main chat application page component
 * @returns {JSX.Element} - The rendered page component
 */
export default function Home() {
  const { messages, isSubmitting, fileCitations, submitMessage } =
    useChatStream();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col bg-white dark:bg-black">
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
    </div>
  );
}
