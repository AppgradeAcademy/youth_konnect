"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaBuilding, FaUsers, FaCheck, FaUserPlus, FaArrowLeft, FaPoll } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";

interface OrganizationProfile {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  _count: {
    followers: number;
    groups: number;
    categories: number;
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: {
    members: number;
  };
}

export default function OrganizationProfile() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    if (params.id) {
      fetchOrganizationProfile();
      fetchGroups();
      checkFollowStatus();
    }
  }, [params.id, currentUser]);

  const fetchOrganizationProfile = async () => {
    try {
      const response = await fetch(`/api/organizations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
      } else {
        showToast("Organization not found", "error");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      showToast("Failed to load organization", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`/api/organizations/${params.id}/groups`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !params.id) return;
    
    try {
      const response = await fetch(`/api/organizations/${params.id}/follow?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      showToast("Please log in to follow organizations", "info");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${params.id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        showToast(isFollowing ? "Unfollowed" : "Following", "success");
        if (organization) {
          setOrganization({
            ...organization,
            _count: {
              ...organization._count,
              followers: isFollowing
                ? organization._count.followers - 1
                : organization._count.followers + 1,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      showToast("Failed to update follow status", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl">
            <FaBuilding />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {organization.name}
            </h1>
            {organization.description && (
              <p className="text-gray-600 mb-2">{organization.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FaUsers />
                <span>{organization._count.followers} followers</span>
              </div>
              <div className="flex items-center gap-1">
                <FaBuilding />
                <span>{organization._count.groups} groups</span>
              </div>
              <div className="flex items-center gap-1">
                <FaPoll />
                <span>{organization._count.categories} polls</span>
              </div>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                isFollowing
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-[#DC143C] text-white hover:bg-[#B8122E]"
              }`}
            >
              {isFollowing ? <FaCheck /> : <FaUserPlus />}
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* Groups */}
      {groups.length > 0 && (
        <div className="instagram-card p-4 sm:p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Groups</h2>
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <FaUsers />
                  <span>{group._count.members} members</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Polls Link */}
      <div className="instagram-card p-4 sm:p-6">
        <Link
          href={`/polls?orgId=${organization.id}`}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FaPoll className="text-2xl text-[#DC143C]" />
            <div>
              <h3 className="font-semibold text-gray-900">View Polls</h3>
              <p className="text-sm text-gray-600">{organization._count.categories} active polls</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>
    </div>
  );
}

