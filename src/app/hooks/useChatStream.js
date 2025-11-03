"use client";

import { useState, useCallback } from "react";
import {
  sendChatMessage,
  createStreamDecoder,
  parseSSEMessage,
} from "../services/chatService";
import { fetchFileContent } from "../services/fileService";

/**
 * Custom hook to handle chat streaming functionality
 * @returns {Object} - Chat streaming state and functions
 */
export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileCitations, setFileCitations] = useState({});

  /**
   * Submits a message to the chat API and processes the streaming response
   * @param {string} userMessage - The message to submit
   */
  const submitMessage = useCallback(
    async (userMessage) => {
      if (!userMessage.trim() || isSubmitting) return;

      setIsSubmitting(true);

      // Create a local data structure to track citations for this submission
      const currentMessageCitations = {};
      const currentMessages = [...messages];

      // Add user message and empty assistant message that will be updated as stream arrives
      currentMessages.push({ role: "user", content: userMessage });
      currentMessages.push({ role: "assistant", content: "" });
      setMessages(currentMessages);

      try {
        const stream = await sendChatMessage(userMessage, conversationId);
        const reader = stream.getReader();
        const decoder = createStreamDecoder();
        let accumulatedContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (separated by \n\n)
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || ""; // Keep incomplete message in buffer

          for (const part of parts) {
            if (part.trim() === "") continue;

            // Parse SSE format: "data: {json}"
            const lines = part.split("\n");
            for (const line of lines) {
              const data = parseSSEMessage(line);
              if (!data) continue;

              // Handle different event types from OpenAI streaming
              if (data.type === "delta" && data.content) {
                accumulatedContent += data.content;

                // Update the last message (assistant message) with accumulated content
                setMessages((prev) => {
                  const updated = [...prev];
                  // Find the last assistant message (empty one we just added)
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === "assistant") {
                      updated[i] = {
                        role: "assistant",
                        content: accumulatedContent,
                      };
                      break;
                    }
                  }
                  return updated;
                });
              } else if (data.type === "conversationId") {
                setConversationId(data.conversationId);
              } else if (data.type === "annotation") {
                // Handle file citation annotation
                if (data.annotation?.type === "file_citation") {
                  // Store citation with the current message index
                  const messageIndex = currentMessages.length - 1;
                  console.log("messageIndex");
                  console.log(messageIndex);

                  // Initialize the array for this message index if needed
                  if (!currentMessageCitations[messageIndex]) {
                    currentMessageCitations[messageIndex] = [];
                  }
                  console.log("currentMessageCitations");
                  console.log(currentMessageCitations);

                  // Add the citation to our local tracking array
                  currentMessageCitations[messageIndex].push(data.annotation);

                  // Also update the state for immediate rendering
                  setFileCitations((prev) => ({
                    ...prev,
                    [messageIndex]: [
                      ...(prev[messageIndex] || []),
                      data.annotation,
                    ],
                  }));
                }
              } else if (data.type === "done") {
                // Stream is complete
                // Process file citations if any
                const messageIndex = currentMessages.length - 1;
                console.log("messageIndex2");
                console.log(messageIndex);
                // Use our local data structure instead of the state
                const messageCitations =
                  currentMessageCitations[messageIndex] || [];

                if (messageCitations.length > 0) {
                  // Create a local array to store updated citations with content
                  const updatedCitations = [...messageCitations];

                  for (let i = 0; i < messageCitations.length; i++) {
                    const citation = messageCitations[i];
                    try {
                      const fileContent = await fetchFileContent(
                        citation.file_id
                      );
                      console.log("fileContent");
                      console.log(fileContent);
                      if (fileContent) {
                        // Update our local array instead of state
                        updatedCitations[i] = {
                          ...citation,
                          content: fileContent,
                        };
                      }
                    } catch (error) {
                      console.error(
                        `Error fetching file ${citation.file_id}:`,
                        error
                      );
                    }
                  }

                  // Now update the state once with all the fetched content
                  setFileCitations((prev) => ({
                    ...prev,
                    [messageIndex]: updatedCitations,
                  }));
                }
                break;
              } else if (data.type === "error") {
                // Handle error from stream
                setMessages((prev) => {
                  const updated = [...prev];
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === "assistant") {
                      updated[i] = {
                        role: "assistant",
                        content: `Error: ${data.error || "An error occurred"}`,
                      };
                      break;
                    }
                  }
                  return updated;
                });
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error submitting message:", error);
        setMessages((prev) => {
          const updated = [...prev];
          // Find the last assistant message and update it with error
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === "assistant") {
              updated[i] = {
                role: "assistant",
                content: "Error: Failed to submit message. Please try again.",
              };
              break;
            }
          }
          return updated;
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId, isSubmitting, messages.length]
  );

  return {
    messages,
    setMessages,
    conversationId,
    isSubmitting,
    fileCitations,
    submitMessage,
  };
}
