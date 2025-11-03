"use client";

import { useState, useRef, useEffect } from "react";
import FileCitation from "./FileCitation";

export default function CitationCarousel({ citations = [] }) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check if scroll arrows should be displayed
  useEffect(() => {
    const checkScrollPosition = () => {
      if (!scrollContainerRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
    };

    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener("scroll", checkScrollPosition);

      // Initial check to see if right arrow is needed
      setShowRightArrow(container.scrollWidth > container.clientWidth);

      return () => container.removeEventListener("scroll", checkScrollPosition);
    }
  }, [citations]);

  // Early return if no citations
  if (!citations || citations.length === 0) return null;

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = direction === "left" ? -320 : 320; // 300px + 1rem gap

    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="mt-4 relative">
      <div
        className={`carousel-outer relative ${
          showLeftArrow ? "left-arrow" : ""
        } ${showRightArrow ? "right-arrow" : ""}`}
      >
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2  z-10 cursor-pointer"
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 20 8 12 16 4"></polyline>
            </svg>
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {citations.map((citation, index) => (
            <FileCitation
              key={`citation-${index}`}
              citation={citation?.content}
            />
          ))}
        </div>

        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2  z-10 cursor-pointer"
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="8 20 16 12 8 4"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Custom scrollbar indicator */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
