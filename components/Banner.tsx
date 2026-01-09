"use client";

import { useState } from "react";

export default function Banner() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="instagram-card overflow-hidden mb-8">
      {!imageError && (
        <img 
          src="/images/banner.png" 
          alt="Verse Banner" 
          className="w-full h-auto object-contain"
          onError={() => setImageError(true)}
        />
      )}
      {imageError && (
        <div className="p-12 text-center bg-gradient-to-r from-[#DC143C] to-[#003F7F] text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to Verse
          </h1>
          <p className="text-2xl md:text-3xl mb-2">Verse - Youth Connect by AFM Rzeszow</p>
          <p className="text-lg md:text-xl mt-4 opacity-90">
            Connect, vote, chat, and grow together in faith
          </p>
        </div>
      )}
    </div>
  );
}
