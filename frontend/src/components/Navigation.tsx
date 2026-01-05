import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaHome, FaVoteYea, FaComments, FaInfoCircle, FaSignInAlt, FaUser, FaSignOutAlt, FaUserShield } from "react-icons/fa";
import Logo from "./Logo";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-dark sticky top-0 z-50 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo />
            <span className="text-2xl font-bold">Youth Connect</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link
              to="/"
              className={`flex items-center gap-2 hover:text-indigo-200 transition-colors ${
                isActive("/") ? "text-indigo-200 font-semibold" : ""
              }`}
            >
              <FaHome /> Home
            </Link>
            <Link
              to="/myvote"
              className={`flex items-center gap-2 hover:text-indigo-200 transition-colors ${
                isActive("/myvote") ? "text-indigo-200 font-semibold" : ""
              }`}
            >
              <FaVoteYea /> MyVote
            </Link>
            <Link
              to="/chatroom"
              className={`flex items-center gap-2 hover:text-indigo-200 transition-colors ${
                isActive("/chatroom") ? "text-indigo-200 font-semibold" : ""
              }`}
            >
              <FaComments /> Chatroom
            </Link>
            <Link
              to="/about"
              className={`flex items-center gap-2 hover:text-indigo-200 transition-colors ${
                isActive("/about") ? "text-indigo-200 font-semibold" : ""
              }`}
            >
              <FaInfoCircle /> About Us
            </Link>
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 hover:text-indigo-200 transition-colors ${
                  isActive("/admin") ? "text-indigo-200 font-semibold" : ""
                }`}
              >
                <FaUserShield /> Admin
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/30">
                <div className="flex items-center gap-2">
                  <FaUser className="text-sm" />
                  <span className="text-sm">
                    {user.name} {user.role === "admin" && "(Admin)"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="glass-dark hover:bg-white/20 px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="glass-dark hover:bg-white/20 px-4 py-2 rounded-lg transition-colors ml-4 flex items-center gap-2"
              >
                <FaSignInAlt /> Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

