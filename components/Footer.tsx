"use client";

import { FaInstagram, FaFacebook, FaHeart } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm">
            <p>© {new Date().getFullYear()} Verse - AFM Rzeszow</p>
            <p className="mt-1 flex items-center gap-1 text-gray-500">
              Made with <FaHeart className="text-[#DC143C] text-xs" /> for our youth community
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-gray-700 font-medium text-sm">Follow us:</span>
            <a
              href="https://www.instagram.com/afm_rzeszow?igsh=aGlhMTU0MHZmb3Jo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-[#DC143C] transition-colors"
              aria-label="Follow us on Instagram"
            >
              <FaInstagram className="text-2xl" />
              <span className="text-sm font-medium">Instagram</span>
            </a>
            
            <a
              href="https://www.facebook.com/share/16obiXYnVP/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-[#DC143C] transition-colors"
              aria-label="Follow us on Facebook"
            >
              <FaFacebook className="text-2xl" />
              <span className="text-sm font-medium">Facebook</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
