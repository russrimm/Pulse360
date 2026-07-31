'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ src, alt, onClose }: ImageModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleEscape);
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  const imageSrc = src.startsWith(window.location.origin)
    ? src.slice(window.location.origin.length)
    : src;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Image preview: ${alt}` : 'Image preview'}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative h-[90vh] w-[90vw]">
        <Image src={imageSrc} alt={alt} fill sizes="90vw" className="object-contain" />
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close image"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
