"use client";

import { useState, useEffect } from "react";

/**
 * Format content by converting <code> tags to styled spans
 * @param {string} content - The content to format
 * @returns {JSX.Element[]} - Array of formatted content elements
 */
function formatCodeTags(content) {
  if (!content) return [];

  // Split the content by <code> and </code> tags
  const parts = content.split(/(<code>.*?<\/code>)/g);

  return parts.map((part, index) => {
    // Check if this part contains code tags
    if (part.startsWith("<code>") && part.endsWith("</code>")) {
      // Extract the code content
      const codeText = part.slice(6, -7); // Remove <code> and </code>
      return (
        <span
          key={index}
          className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-sm"
        >
          {codeText}
        </span>
      );
    }
    // Return regular text
    return <span key={index}>{part}</span>;
  });
}

/**
 * ProjectDetails component to display project information
 * @returns {JSX.Element} - The rendered project details component
 */
export default function ProjectDetails() {
  const projectDetails = [
    {
      sectionTitle: "Overview",
      description: "",
      content: `This is a RAG based chatbot using ~5,000 events from Mobilize.us to answer questions about events, volunteer opportunities, petitions, and community groups. In addition to natural language processing, the chatbot uses event citations to create a caruosel of cards that link back to the original event on mobilize.us.
        The app utilizes text steaming to decrease the time users have to wait for a response.`,
    },
    {
      sectionTitle: "Getting the data",
      content: `The data was pulled by making requests to <code>https://www.mobilize.us/?show_all_events=true&page={page}&per_page=100</code>, <code>https://www.mobilize.us/?country=US&state={state_code}&page={{page}}&per_page=100</code>, and <code>https://www.mobilize.us/?is_virtual=true&page={page}&per_page=100</code>.
        For each result the code looks for the <code>window.__MLZ_EMBEDDED_DATA__</code> variable, if the events key is not found, it jumps to the next type of request. (i.e. the next state if using the state code request or virtual events once all states are done)
        If the events key is found, it processes the event objects and gets the next page until the events key is no longer found.`,
      linkText: "Python notebook used for data processing",
      linkUrl:
        "https://colab.research.google.com/drive/1mrszRLrVH4PzGcqxDVff37PjJGiSFLwz?usp=sharing",
    },
    {
      sectionTitle: "Restructuring the data",
      content: `For each event object, we strip it down to only the fields we need: id, name, organization_name, city, state, country, time_start, time_end, description, image_url, and url.
        The Start and End time are converted to a human readable format to optimize for semantic understanding
        This new object is saved to a JSON file to be processed and stored in a vector database.`,
    },
    {
      sectionTitle: "Storing the data",
      content: `For each saved JSON file, we convert it to a txt and upload that to the vector database. Non-human readable data is excluded from the document conent.
        Image URL and ID are stored as metadata to be used for the citation cards.
        Additional metadata is stored to help with filtering and searching in the future. Metadata filters are not used at this point.`,
    },
    {
      sectionTitle: "Chunking process",
      content: `Due to the small size of each individual event, the most important details are able to fit into a single chunk, rather than forcing us to rely on metadata to filter on things like date (although metadata filtering will likely improve accuracy).
        Because of this, static chunk sizes are used with OpenAI's maximum chunk size`,
    },
    {
      sectionTitle: "Chat interface",
      content: `The chat bot uses the OpenAI responses API to handle the vector search and generate a natural language response.
        The app utilizes a next.js server component with streaming to handle the user's message.
        Event ids are returned as citation events in the stream. These are captured and used to make a subsequent request to get the relevent metadata (image url, id, etc.) which will be used to populate the cards.`,
    },
  ];
  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-16">
      <div className="max-w-4xl mx-auto">
        {/* Empty component as specified - content will be added later */}
        <div className="min-h-[200px] flex flex-col">
          <h2 className="text-zinc-600 text-3xl font-medium mb-4">
            Project Details
          </h2>
          {projectDetails.map((detail) => (
            <div key={detail.sectionTitle}>
              <h3 className="text-zinc-600 text-2xl font-medium">
                {detail.sectionTitle}
              </h3>
              <p className="text-zinc-600 text-lg mb-3">
                {formatCodeTags(detail.content)}
              </p>
              {detail.linkText && detail.linkUrl && (
                <p className="text-zinc-600 text-lg mb-3">
                  <a
                    href={detail.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 font-semibold hover:underline"
                  >
                    {detail.linkText}
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
