"use client";

/**
 * Sends a message to the chat API and returns a readable stream for processing
 * @param {string} message - The message to send
 * @param {string|null} conversationId - The conversation ID if continuing a conversation
 * @returns {Promise<ReadableStream>} - A readable stream of the response
 */
export async function sendChatMessage(message, conversationId = null) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      conversationId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.body;
}

/**
 * Creates a text decoder for processing the stream
 * @returns {TextDecoder} - A text decoder instance
 */
export function createStreamDecoder() {
  return new TextDecoder();
}

/**
 * Processes an SSE message and extracts the JSON data
 * @param {string} line - The SSE message line
 * @returns {Object|null} - The parsed JSON data or null if invalid
 */
export function parseSSEMessage(line) {
  if (line.startsWith("data: ")) {
    try {
      const jsonStr = line.slice(6); // Remove "data: " prefix
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn("Failed to parse SSE data:", line, error);
      return null;
    }
  }
  return null;
}
