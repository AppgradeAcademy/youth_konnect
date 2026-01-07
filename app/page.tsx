"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaHeart, FaComment, FaPaperPlane, FaBookmark, FaEllipsisH, FaUserCircle } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

interface Question {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  tags: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: { answers: number };
}

export default function Home() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/questions");
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Loading posts...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="instagram-card p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Youth Connect</h2>
          <p className="text-gray-600 mb-6">Please log in to see posts from our community</p>
          <Link
            href="/login"
            className="inline-block bg-[#DC143C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {questions.length === 0 ? (
        <div className="instagram-card p-8 text-center">
          <p className="text-gray-500 mb-4">No posts yet</p>
          <Link
            href="/chatroom"
            className="inline-block bg-[#DC143C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors"
          >
            Create First Post
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question) => (
            <article key={question.id} className="instagram-card">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#DC143C] to-[#B8122E] flex items-center justify-center text-white font-semibold">
                    {question.isAnonymous ? (
                      <FaUserCircle className="text-lg" />
                    ) : (
                      (question.user?.name?.[0] || "U").toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {question.isAnonymous ? "Anonymous" : question.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(question.createdAt)}</p>
                  </div>
                </div>
                <button className="text-gray-600 hover:text-gray-900">
                  <FaEllipsisH />
                </button>
              </div>

              {/* Post Image */}
              {question.imageUrl && (
                <div className="w-full aspect-square bg-gray-100 relative">
                  <img
                    src={question.imageUrl}
                    alt={question.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="p-4 pt-3">
                <div className="flex items-center gap-4 mb-3">
                  <button className="text-gray-900 hover:opacity-70 transition-opacity">
                    <FaHeart className="text-2xl" />
                  </button>
                  <Link
                    href={`/chatroom?question=${question.id}`}
                    className="text-gray-900 hover:opacity-70 transition-opacity"
                  >
                    <FaComment className="text-2xl" />
                  </Link>
                  <button className="text-gray-900 hover:opacity-70 transition-opacity">
                    <FaPaperPlane className="text-2xl" />
                  </button>
                  <div className="flex-1"></div>
                  <button className="text-gray-900 hover:opacity-70 transition-opacity">
                    <FaBookmark className="text-2xl" />
                  </button>
                </div>

                {/* Likes count */}
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  {question._count?.answers || 0} {question._count?.answers === 1 ? "answer" : "answers"}
                </p>

                {/* Post Caption */}
                <div className="mb-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">
                      {question.isAnonymous ? "Anonymous" : question.user?.name || "Unknown"}
                    </span>
                    <span className="text-gray-900 ml-2">{question.title}</span>
                  </p>
                  {question.content && (
                    <p className="text-sm text-gray-700 mt-1">{question.content}</p>
                  )}
                </div>

                {/* Tags */}
                {question.tags && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {question.tags.split(',').map((tag: string, idx: number) => (
                      <span key={idx} className="text-sm text-blue-600">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* View Comments */}
                {question._count && question._count.answers > 0 && (
                  <Link
                    href={`/chatroom?question=${question.id}`}
                    className="text-sm text-gray-500 mt-2 block hover:text-gray-700"
                  >
                    View all {question._count.answers} {question._count.answers === 1 ? "answer" : "answers"}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
