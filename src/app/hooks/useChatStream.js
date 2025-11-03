"use client";

import { useState, useCallback, useEffect } from "react";
import {
  sendChatMessage,
  createStreamDecoder,
  parseSSEMessage,
} from "../services/chatService";
import { fetchFileContent } from "../services/fileService";

// Constants for localStorage keys
const STORAGE_KEY = "mobilize_chat_data";

/**
 * Safely checks if localStorage is available
 * @returns {boolean} - Whether localStorage is available
 */
const isLocalStorageAvailable = () => {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Safely stores data in localStorage with size limits
 * @param {string} key - The key to store data under
 * @param {Object} data - The data to store
 * @returns {boolean} - Whether the operation was successful
 */
const safelyStoreData = (key, data) => {
  try {
    const serialized = JSON.stringify(data);
    // Check if data is too large (5MB is a common limit)
    if (serialized.length > 4 * 1024 * 1024) {
      console.warn("Data too large for localStorage, not saving");
      return false;
    }
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error("Error storing data in localStorage:", error);
    return false;
  }
};

/**
 * Custom hook to handle chat streaming functionality
 * @returns {Object} - Chat streaming state and functions
 */
export function useChatStream() {
  // Initialize state from localStorage if available
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileCitations, setFileCitations] = useState({});

  // Load data from localStorage on initial render
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      console.warn("localStorage is not available, persistence disabled");
      return;
    }

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // Validate the structure of loaded data
        if (Array.isArray(parsedData.messages)) {
          setMessages(parsedData.messages);
        }

        if (parsedData.conversationId) {
          setConversationId(parsedData.conversationId);
        }

        if (
          parsedData.fileCitations &&
          typeof parsedData.fileCitations === "object"
        ) {
          setFileCitations(parsedData.fileCitations);
        }
      }
    } catch (error) {
      console.error("Error loading chat data from localStorage:", error);
      // If data is corrupted, clear it
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, []);

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

                  // Initialize the array for this message index if needed
                  if (!currentMessageCitations[messageIndex]) {
                    currentMessageCitations[messageIndex] = [];
                  }

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

  // Save data to localStorage whenever it changes
  useEffect(() => {
    // Skip saving if there are no messages (empty state)
    if (messages.length === 0 && !conversationId) {
      return;
    }

    // Skip if localStorage is not available
    if (!isLocalStorageAvailable()) {
      return;
    }

    // Prepare data for storage
    const dataToSave = {
      messages,
      conversationId,
      fileCitations,
    };

    // Use our safe storage function
    safelyStoreData(STORAGE_KEY, dataToSave);
  }, [messages, conversationId, fileCitations]);

  /**
   * Clears the current conversation data and starts a new conversation
   */
  const startNewConversation = useCallback(() => {
    // Reset state
    setMessages([]);
    setConversationId(null);
    setFileCitations({});

    // Clear localStorage if available
    if (isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing chat data from localStorage:", error);
      }
    }
  }, []);

  return {
    messages,
    setMessages,
    conversationId,
    isSubmitting,
    fileCitations,
    submitMessage,
    startNewConversation,
  };
}
