"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaHeart, FaComment, FaPaperPlane, FaBookmark, FaEllipsisH, FaUserCircle, FaPaperPlane as FaSend, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string | null;
    email: string;
  };
}

interface Post {
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
  answers?: Comment[];
  _count?: { answers: number };
}

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [postingComment, setPostingComment] = useState<Record<string, boolean>>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/questions");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch posts:", response.status, errorData);
        setPosts([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      console.log("Fetched posts:", data); // Debug log
      // Ensure data is an array
      if (Array.isArray(data)) {
        console.log("Setting posts:", data.length, "posts found");
        setPosts(data);
      } else {
        console.error("Invalid data format - not an array:", data);
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/questions/${postId}/answers`);
      if (!response.ok) {
        console.error("Failed to fetch comments:", response.status);
        return;
      }
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, answers: data } : post
        ));
      } else {
        console.error("Invalid comments data format:", data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleToggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        // Fetch comments if not already loaded
        const post = posts.find(p => p.id === postId);
        if (post && !post.answers) {
          fetchComments(postId);
        }
      }
      return newSet;
    });
  };

  const handleSubmitComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newComments[postId]?.trim() || !user) return;

    setPostingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`/api/questions/${postId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: newComments[postId].trim(),
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                answers: [...(post.answers || []), newComment],
                _count: { answers: (post._count?.answers || 0) + 1 }
              } 
            : post
        ));
        setNewComments(prev => ({ ...prev, [postId]: "" }));
        showToast("Comment posted!", "success");
      } else {
        showToast("Failed to post comment", "error");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      showToast("Failed to post comment", "error");
    } finally {
      setPostingComment(prev => ({ ...prev, [postId]: false }));
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

  const displayName = (commentUser: Comment["user"]) => {
    return commentUser.username || commentUser.name;
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditTags(post.tags || "");
    setEditImageUrl(post.imageUrl || "");
  };

  const handleSaveEdit = async (postId: string) => {
    if (!user || !editTitle.trim()) return;

    try {
      const response = await fetch(`/api/questions/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: editTitle.trim(),
          content: editContent.trim() || editTitle.trim(),
          tags: editTags.trim() || null,
          imageUrl: editImageUrl || null,
        }),
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        setEditingPost(null);
        showToast("Post updated successfully!", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to update post", "error");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      showToast("Failed to update post", "error");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    setDeletingPost(postId);
    try {
      const response = await fetch(`/api/questions/${postId}?userId=${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setShowDeleteConfirm(null);
        showToast("Post deleted successfully!", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to delete post", "error");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast("Failed to delete post", "error");
    } finally {
      setDeletingPost(null);
    }
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Verse</h2>
          <p className="text-gray-600 mb-6">Please log in to see posts from our community</p>
          <button
            onClick={() => router.push("/login")}
            className="inline-block bg-[#DC143C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  console.log("Rendering Home - posts count:", posts.length, "loading:", loading, "user:", !!user); // Debug log

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-20 md:pb-4">
      {!loading && posts.length === 0 ? (
        <div className="instagram-card p-8 text-center">
          <p className="text-gray-500 mb-4">No posts yet. Be the first to share something!</p>
          <button
            onClick={() => router.push("/create")}
            className="inline-block bg-[#DC143C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors"
          >
            Create First Post
          </button>
        </div>
      ) : !loading && posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => {
            const isExpanded = expandedComments.has(post.id);
            const commentCount = post._count?.answers || post.answers?.length || 0;
            
            return (
              <article key={post.id} className="instagram-card">
                {/* Post Header */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#DC143C] to-[#B8122E] flex items-center justify-center text-white font-semibold">
                      {post.isAnonymous ? (
                        <FaUserCircle className="text-lg" />
                      ) : (
                        (post.user?.name?.[0] || "U").toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {post.isAnonymous ? "Anonymous" : post.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!post.isAnonymous && user && post.user?.id === user.id && (
                      <>
                        {editingPost !== post.id ? (
                          <>
                            <button
                              onClick={() => handleEditPost(post)}
                              className="text-gray-600 hover:text-[#DC143C] transition-colors p-2"
                              aria-label="Edit post"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(post.id)}
                              className="text-gray-600 hover:text-red-600 transition-colors p-2"
                              aria-label="Delete post"
                            >
                              <FaTrash />
                            </button>
                          </>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(post.id)}
                              className="text-green-600 hover:text-green-700 transition-colors p-2"
                              aria-label="Save"
                            >
                              <FaPaperPlane />
                            </button>
                            <button
                              onClick={() => {
                                setEditingPost(null);
                                setEditTitle("");
                                setEditContent("");
                                setEditTags("");
                                setEditImageUrl("");
                              }}
                              className="text-gray-600 hover:text-gray-900 transition-colors p-2"
                              aria-label="Cancel"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    {editingPost !== post.id && (
                      <button className="text-gray-600 hover:text-gray-900">
                        <FaEllipsisH />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Image */}
                {post.imageUrl && (
                  <div className="w-full aspect-square bg-gray-100 relative">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
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
                    <button 
                      onClick={() => handleToggleComments(post.id)}
                      className="text-gray-900 hover:opacity-70 transition-opacity"
                    >
                      <FaComment className="text-2xl" />
                    </button>
                    <button className="text-gray-900 hover:opacity-70 transition-opacity">
                      <FaPaperPlane className="text-2xl" />
                    </button>
                    <div className="flex-1"></div>
                    <button className="text-gray-900 hover:opacity-70 transition-opacity">
                      <FaBookmark className="text-2xl" />
                    </button>
                  </div>

                  {/* Comments count */}
                  {commentCount > 0 && (
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="text-sm text-gray-500 mb-2 hover:text-gray-700"
                    >
                      View all {commentCount} {commentCount === 1 ? "comment" : "comments"}
                    </button>
                  )}

                  {/* Post Caption - Edit Mode or View Mode */}
                  {editingPost === post.id ? (
                    <div className="mb-2 space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Caption..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Description..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] resize-none"
                      />
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Tags (comma-separated)"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                      />
                      <input
                        type="text"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="Image URL"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mb-2">
                        <p className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {post.isAnonymous ? "Anonymous" : post.user?.name || "Unknown"}
                          </span>
                          <span className="text-gray-900 ml-2">{post.title}</span>
                        </p>
                        {post.content && (
                          <p className="text-sm text-gray-700 mt-1">{post.content}</p>
                        )}
                      </div>

                      {/* Tags */}
                      {post.tags && (
                        <div className="flex gap-2 flex-wrap mt-2 mb-2">
                          {post.tags.split(',').map((tag: string, idx: number) => (
                            <span key={idx} className="text-sm text-blue-600">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Comments Section */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      {/* Existing Comments */}
                      {post.answers && post.answers.length > 0 && (
                        <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
                          {post.answers.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#DC143C] to-[#B8122E] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {(displayName(comment.user)[0] || "U").toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-semibold text-gray-900">{displayName(comment.user)}</span>
                                  <span className="text-gray-900 ml-2">{comment.content}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(comment.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Form */}
                      <form onSubmit={(e) => handleSubmitComment(post.id, e)} className="flex gap-2 pt-2 border-t border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#DC143C] to-[#B8122E] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {(user.name[0] || "U").toUpperCase()}
                        </div>
                        <input
                          type="text"
                          value={newComments[post.id] || ""}
                          onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Add a comment..."
                          className="flex-1 text-sm border-0 focus:ring-0 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!newComments[post.id]?.trim() || postingComment[post.id]}
                          className="text-[#DC143C] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {postingComment[post.id] ? "Posting..." : "Post"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Comment Toggle for collapsed state */}
                  {!isExpanded && commentCount === 0 && (
                    <form onSubmit={(e) => handleSubmitComment(post.id, e)} className="flex gap-2 pt-2 border-t border-gray-100 mt-3">
                      <input
                        type="text"
                        value={newComments[post.id] || ""}
                        onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Add a comment..."
                        className="flex-1 text-sm border-0 focus:ring-0 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newComments[post.id]?.trim() || postingComment[post.id]}
                        className="text-[#DC143C] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {postingComment[post.id] ? "Posting..." : "Post"}
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Post</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={!!deletingPost}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(showDeleteConfirm)}
                disabled={!!deletingPost}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingPost === showDeleteConfirm ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
