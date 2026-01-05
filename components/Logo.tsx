"use client";

import { useState } from "react";

export default function Logo() {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="relative w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
      {!logoError ? (
        <img 
          src="/images/logo.png" 
          alt="Youth Connect Logo" 
          className="w-full h-full object-contain p-1"
          onError={() => setLogoError(true)}
        />
      ) : (
        <span className="text-indigo-600 font-bold text-xl">YC</span>
      )}
    </div>
  );
}

