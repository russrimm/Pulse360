'use client';

import { useEffect, useRef } from 'react';

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ src, alt, onClose }: ImageModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Image preview: ${alt}` : 'Image preview'}
      className="fixed inset-0 z-50 flex overscroll-contain items-center justify-center bg-black/75 p-4"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]">
        <img src={src} alt={alt} className="max-h-[90vh] max-w-full object-contain" />
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded text-white hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close image preview"
        >
          <svg
            aria-hidden="true"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
