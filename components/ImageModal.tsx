"use client";

import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, alt, isOpen, onClose }: ImageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10 p-2"
          aria-label="Close"
        >
          <FaTimes className="text-2xl" />
        </button>
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl mx-auto"
        />
      </div>
    </div>
  );
}


