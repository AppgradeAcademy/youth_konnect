"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaUser, FaEnvelope, FaCalendar, FaUsers, FaUserPlus, FaUserCheck, FaArrowLeft } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";

interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  email: string;
  createdAt: string;
  _count: {
    followers: number;
    following: number;
    questions: number;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  _count?: { answers: number };
}

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    if (params.id) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [params.id]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        checkFollowStatus();
      } else {
        showToast("User not found", "error");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      showToast("Failed to load user profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !params.id) return;
    
    try {
      const response = await fetch(`/api/users/${params.id}/follow?followerId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/questions?userId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      showToast("Please log in to follow users", "info");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/users/${params.id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: currentUser.id }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        showToast(isFollowing ? "Unfollowed" : "Following", "success");
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            _count: {
              ...userProfile._count,
              followers: isFollowing
                ? userProfile._count.followers - 1
                : userProfile._count.followers + 1,
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

  if (!userProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">User not found</p>
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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#DC143C] to-[#B8122E] flex items-center justify-center text-white text-3xl font-semibold">
            {(userProfile.name[0] || "U").toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {userProfile.name}
            </h1>
            {userProfile.username && (
              <p className="text-gray-600 mb-2">@{userProfile.username}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FaUsers />
                <span>{userProfile._count.followers} followers</span>
              </div>
              <div className="flex items-center gap-1">
                <FaUserCheck />
                <span>{userProfile._count.following} following</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{userProfile._count.questions} posts</span>
              </div>
            </div>
          </div>
          {currentUser && currentUser.id !== userProfile.id && (
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                isFollowing
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-[#DC143C] text-white hover:bg-[#B8122E]"
              }`}
            >
              {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FaEnvelope className="text-gray-400" />
            <span>{userProfile.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCalendar className="text-gray-400" />
            <span>Joined {new Date(userProfile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Posts</h2>
        {posts.length === 0 ? (
          <div className="instagram-card p-8 text-center">
            <p className="text-gray-500">No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="instagram-card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
              <p className="text-gray-700 mb-3">{post.content}</p>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full rounded-lg mb-3"
                />
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                {post._count && (
                  <span>{post._count.answers} comments</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

