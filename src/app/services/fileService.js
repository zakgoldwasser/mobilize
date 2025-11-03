"use client";

/**
 * Fetches file content from OpenAI using the file ID
 * @param {string} fileId - The ID of the file to fetch
 * @returns {Promise<string|null>} - The file content or null if there was an error
 */
export async function fetchFileContent(fileId) {
  try {
    const response = await fetch("/api/file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Error fetching file content:", error);
    return null;
  }
}
