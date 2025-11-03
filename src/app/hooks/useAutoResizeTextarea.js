"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook to automatically resize a textarea based on its content
 * @param {string} value - The current value of the textarea
 * @returns {React.RefObject} - A ref to attach to the textarea element
 */
export function useAutoResizeTextarea(value) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";
      // Set the height to the scrollHeight to fit the content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return textareaRef;
}
