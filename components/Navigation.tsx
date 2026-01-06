"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaHome, FaVoteYea, FaComments, FaInfoCircle, FaSignInAlt, FaUser, FaSignOutAlt, FaUserShield, FaBars, FaTimes } from "react-icons/fa";
import Logo from "./Logo";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="nav-clean sticky top-0 z-50 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <Logo />
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#DC143C] to-[#B8122E] bg-clip-text text-transparent">
              Youth Connect
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1 items-center">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
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
