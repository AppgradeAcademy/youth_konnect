"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaUserPlus, FaUserCheck, FaUser } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";

interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  isFollowing?: boolean;
  _count?: {
    followers: number;
    following: number;
  };
}

export default function SearchUsers() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}&userId=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        // Update following map
        const map: Record<string, boolean> = {};
        data.forEach((u: User) => {
          map[u.id] = u.isFollowing || false;
        });
        setFollowingMap(map);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      showToast("Failed to search users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: user.id }),
      });

      if (response.ok) {
        setFollowingMap(prev => ({ ...prev, [userId]: true }));
        showToast("Now following user", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to follow user", "error");
      }
    } catch (error) {
      console.error("Error following user:", error);
      showToast("Failed to follow user", "error");
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `/api/users/${userId}/follow?followerId=${user.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setFollowingMap(prev => ({ ...prev, [userId]: false }));
        showToast("Unfollowed user", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to unfollow user", "error");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      showToast("Failed to unfollow user", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-20 md:pb-4">
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Users</h1>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or username..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
          />
        </div>
      </div>

      {loading && (
        <div className="instagram-card p-8 text-center">
          <p className="text-gray-500">Searching...</p>
        </div>
      )}

      {!loading && searchQuery && results.length === 0 && (
        <div className="instagram-card p-8 text-center">
          <p className="text-gray-500">No users found</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="instagram-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DC143C] to-[#B8122E] flex items-center justify-center text-white font-semibold">
                  {(user.name[0] || "U").toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {user.name}
                    {user.role === "admin" && (
                      <span className="ml-2 text-xs bg-[#DC143C] text-white px-2 py-0.5 rounded">
                        Church
                      </span>
                    )}
                  </p>
                  {user.username && (
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  )}
                  {user._count && (
                    <p className="text-xs text-gray-400">
                      {user._count.followers} followers
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  followingMap[user.id]
                    ? handleUnfollow(user.id)
                    : handleFollow(user.id)
                }
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  followingMap[user.id]
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-[#DC143C] text-white hover:bg-[#B8122E]"
                }`}
              >
                {followingMap[user.id] ? (
                  <>
                    <FaUserCheck /> Following
                  </>
                ) : (
                  <>
                    <FaUserPlus /> Follow
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {!searchQuery && (
        <div className="instagram-card p-8 text-center">
          <FaSearch className="text-4xl mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Start typing to search for users</p>
        </div>
      )}
    </div>
  );
}

