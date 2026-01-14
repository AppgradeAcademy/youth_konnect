"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChurch, FaUsers, FaBuilding, FaUserPlus, FaUserCheck, FaSearch, FaCalendarAlt, FaBullhorn, FaPoll } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    followers: number;
    groups: number;
    categories: number;
    events: number;
    announcements: number;
  };
}

export default function Churches() {
  const router = useRouter();
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (user && organizations.length > 0) {
      fetchFollowingStatus();
    }
  }, [user?.id, organizations.length]); // Only re-run if user ID changes or organizations count changes

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      showToast("Failed to load churches", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingStatus = async () => {
    if (!user) return;
    try {
      const followStatuses: Record<string, boolean> = {};
      await Promise.all(
        organizations.map(async (org) => {
          try {
            const response = await fetch(`/api/organizations/${org.id}/follow?userId=${user.id}`);
            if (response.ok) {
              const data = await response.json();
              followStatuses[org.id] = data.isFollowing;
            }
          } catch (error) {
            console.error(`Error checking follow status for ${org.id}:`, error);
          }
        })
      );
      setFollowingMap(followStatuses);
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  };

  const handleFollow = async (organizationId: string) => {
    if (!user) {
      showToast("Please log in to follow churches", "info");
      router.push("/login");
      return;
    }

    const isFollowing = followingMap[organizationId];
    try {
      const response = await fetch(`/api/organizations/${organizationId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setFollowingMap((prev) => ({ ...prev, [organizationId]: !isFollowing }));
        showToast(isFollowing ? "Unfollowed" : "Following", "success");
        // Update the followers count
        setOrganizations((prev) =>
          prev.map((org) =>
            org.id === organizationId
              ? {
                  ...org,
                  _count: {
                    ...org._count,
                    followers: isFollowing ? org._count.followers - 1 : org._count.followers + 1,
                  },
                }
              : org
          )
        );
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to update follow status", "error");
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      showToast("Failed to update follow status", "error");
    }
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">Loading churches...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-20 md:pb-4">
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <FaChurch className="text-3xl text-[#DC143C]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Church</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search churches..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
          />
        </div>
      </div>

      {filteredOrganizations.length === 0 ? (
        <div className="instagram-card p-8 text-center">
          <FaChurch className="text-4xl mx-auto mb-4 opacity-50 text-gray-400" />
          <p className="text-gray-500">
            {searchQuery ? "No churches found matching your search." : "No churches registered yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrganizations.map((org) => (
            <div
              key={org.id}
              className="instagram-card p-4 sm:p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/organization/${org.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl">
                      <FaChurch />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
                      {org.description && (
                        <p className="text-gray-600 text-sm mt-1">{org.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                    <div className="flex items-center gap-1">
                      <FaUsers />
                      <span>{org._count.followers} followers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaBuilding />
                      <span>{org._count.groups} groups</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt />
                      <span>{org._count.events} events</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaBullhorn />
                      <span>{org._count.announcements} announcements</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaPoll />
                      <span>{org._count.categories} polls</span>
                    </div>
                  </div>
                </div>
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(org.id);
                    }}
                    className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      followingMap[org.id]
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-[#DC143C] text-white hover:bg-[#B8122E]"
                    }`}
                  >
                    {followingMap[org.id] ? <FaUserCheck /> : <FaUserPlus />}
                    {followingMap[org.id] ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

