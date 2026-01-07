"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaHome, FaVoteYea, FaComments, FaInfoCircle, FaSignInAlt, FaUser, FaSignOutAlt, FaUserShield, FaBars, FaTimes, FaBell, FaPlusCircle } from "react-icons/fa";
import Logo from "./Logo";
import { useNotifications } from "@/contexts/NotificationContext";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Fetch notifications on mount and then every 30 seconds
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationPanelOpen(false);
      }
    };

    if (notificationPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationPanelOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="nav-clean sticky top-0 z-50 bg-white shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16 w-full">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity flex-shrink-0 min-w-0">
            <Logo />
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#DC143C] to-[#B8122E] bg-clip-text text-transparent whitespace-nowrap">
              Youth Connect
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1 items-center flex-shrink-0">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive("/") 
                  ? "text-[#DC143C] font-semibold" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FaHome className="text-xl" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/myvote"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive("/myvote") 
                  ? "text-[#DC143C] font-semibold" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FaVoteYea className="text-xl" />
              <span className="hidden sm:inline">MyVote</span>
            </Link>
            <Link
              href="/chatroom"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive("/chatroom") 
                  ? "text-[#DC143C] font-semibold" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FaComments className="text-xl" />
              <span className="hidden sm:inline">Chatroom</span>
            </Link>
            <Link
              href="/create"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive("/create") 
                  ? "text-[#DC143C] font-semibold bg-red-50" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FaPlusCircle className="text-xl" />
              <span className="hidden sm:inline">Post</span>
            </Link>
            <Link
              href="/about"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive("/about") 
                  ? "text-[#DC143C] font-semibold" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FaInfoCircle className="text-xl" />
              <span className="hidden sm:inline">About</span>
            </Link>
            
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/admin") 
                    ? "text-[#DC143C] font-semibold" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FaUserShield className="text-xl" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                <span className="text-sm text-gray-600 hidden md:inline">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FaSignOutAlt />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B8122E] transition-colors ml-2 font-semibold"
              >
                <FaSignInAlt />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button and Notification Bell */}
          <div className="md:hidden flex items-center gap-2 flex-shrink-0">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors relative"
                aria-label="Notifications"
              >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Panel */}
              {notificationPanelOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <FaBell className="text-3xl mx-auto mb-2 opacity-50" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.slice(0, 20).map((notification) => (
                          <Link
                            key={notification.id}
                            href={notification.link || "#"}
                            onClick={() => {
                              markAsRead(notification.id);
                              setNotificationPanelOpen(false);
                            }}
                            className={`block p-4 hover:bg-gray-50 transition-colors ${
                              !notification.read ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                                  {new Date(notification.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/") 
                    ? "text-[#DC143C] font-semibold bg-red-50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FaHome className="text-xl" />
                <span>Home</span>
              </Link>
              <Link
                href="/myvote"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/myvote") 
                    ? "text-[#DC143C] font-semibold bg-red-50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FaVoteYea className="text-xl" />
                <span>MyVote</span>
              </Link>
              <Link
                href="/chatroom"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/chatroom") 
                    ? "text-[#DC143C] font-semibold bg-red-50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FaComments className="text-xl" />
                <span>Chatroom</span>
              </Link>
              <Link
                href="/create"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/create") 
                    ? "text-[#DC143C] font-semibold bg-red-50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FaPlusCircle className="text-xl" />
                <span>Post</span>
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/about") 
                    ? "text-[#DC143C] font-semibold bg-red-50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FaInfoCircle className="text-xl" />
                <span>About</span>
              </Link>
              
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive("/admin") 
                      ? "text-[#DC143C] font-semibold bg-red-50" 
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <FaUserShield className="text-xl" />
                  <span>Admin</span>
                </Link>
              )}
              
              {user ? (
                <div className="pt-2 border-t border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-600">
                    {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors w-full"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B8122E] transition-colors font-semibold"
                >
                  <FaSignInAlt />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
