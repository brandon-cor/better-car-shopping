"use client";

import { useState, useEffect } from "react";

export function useTypingPlaceholder(placeholders: string[], typingSpeed = 80, deletingSpeed = 40, pauseDuration = 2000) {
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const currentPlaceholder = placeholders[index];

    if (isDeleting) {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentPlaceholder.substring(0, displayText.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % placeholders.length);
      }
    } else {
      if (displayText.length < currentPlaceholder.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPlaceholder.substring(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, index, placeholders, typingSpeed, deletingSpeed, pauseDuration]);

  return displayText;
}

