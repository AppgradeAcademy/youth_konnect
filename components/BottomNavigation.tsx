"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaPoll, FaPlusCircle, FaComments, FaUser, FaSearch } from "react-icons/fa";
import { useNotifications } from "@/contexts/NotificationContext";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive("/") ? "text-[#DC143C]" : "text-gray-600"
            }`}
          >
            <FaHome className="text-2xl" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            href="/myvote"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive("/myvote") ? "text-[#DC143C]" : "text-gray-600"
            }`}
          >
            <FaPoll className="text-2xl" />
            <span className="text-xs mt-1">Poll</span>
          </Link>

          <Link
            href="/create"
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              isActive("/create") ? "text-[#DC143C]" : "text-gray-600"
            }`}
          >
            <FaPlusCircle className="text-3xl" />
            <span className="text-xs mt-1">Post</span>
          </Link>

          <Link
            href="/chatroom"
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              pathname === "/chatroom" ? "text-[#DC143C]" : "text-gray-600"
            }`}
          >
            <div className="relative">
              <FaComments className="text-2xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Chat</span>
          </Link>

          <Link
            href="/search"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive("/search") ? "text-[#DC143C]" : "text-gray-600"
            }`}
          >
            <FaSearch className="text-2xl" />
            <span className="text-xs mt-1">Search</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

