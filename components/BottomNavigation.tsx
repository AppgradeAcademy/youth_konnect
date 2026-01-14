"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaHome, FaChurch, FaComments, FaBell, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useNotifications } from "@/contexts/NotificationContext";
import { useEffect, useState } from "react";

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [user, setUser] = useState<any>(null);
  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
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
            href="/churches"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive("/churches") ? "text-[#DC143C]" : "text-gray-600"
            }`}
          >
            <FaChurch className="text-2xl" />
            <span className="text-xs mt-1">Church</span>
          </Link>

          <Link
            href="/chatroom"
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              pathname === "/chatroom" ? "text-[#DC143C]" : "text-gray-600"
            }`}
          >
            <div className="relative">
              <FaComments className="text-2xl" />
            </div>
            <span className="text-xs mt-1">Messages</span>
          </Link>

          <Link
            href="/notifications"
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              pathname === "/notifications" ? "text-[#DC143C]" : "text-gray-600"
            }`}
            onClick={(e) => {
              e.preventDefault();
              // You can add notification panel toggle here if needed
            }}
          >
            <div className="relative">
              <FaBell className="text-2xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Notify</span>
          </Link>

          <Link
            href={user ? `/user/${user.id}` : "/login"}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname.startsWith("/user/") && pathname === `/user/${user.id}` ? "text-[#DC143C]" : "text-gray-600"
            }`}
          >
            <FaUser className="text-2xl" />
            <span className="text-xs mt-1">Profile</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600"
          >
            <FaSignOutAlt className="text-2xl" />
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
