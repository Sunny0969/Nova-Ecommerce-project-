import React from 'react';

/** First focusable control — jumps keyboard/screen-reader users to primary content. */
export default function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}
