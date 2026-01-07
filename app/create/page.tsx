"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaImage, FaTimes, FaUserSecret, FaPaperPlane } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";
import { useNotifications } from "@/contexts/NotificationContext";

export default function CreatePost() {
  const router = useRouter();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chatroomActive, setChatroomActive] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
    fetchChatroomStatus();
  }, [router]);

  const fetchChatroomStatus = async () => {
    try {
      const response = await fetch("/api/chatroom/status");
      const data = await response.json();
      setChatroomActive(data.isActive);
    } catch (error) {
      console.error("Error fetching chatroom status:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title.trim()) {
      showToast("Please enter a caption for your post", "error");
      return;
    }
    
    if (!user) {
      showToast("Please log in to create a post", "error");
      router.push("/login");
      return;
    }
    
    if (!chatroomActive) {
      showToast("Chatroom is currently offline. Please try again later.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim(),
          content: content.trim() || title.trim(), // Use title as content if content is empty
          isAnonymous,
          tags: tags.trim() || null,
          imageUrl: imageUrl || null,
        }),
      });

      if (response.ok) {
        const postData = await response.json();
        showToast("Post created successfully!", "success");
        
        // Add notification
        addNotification({
          type: "question",
          title: postData.title,
          message: isAnonymous 
            ? "An anonymous post was created" 
            : `${user.name} created a new post`,
          link: "/",
        });

        // Clear form
        setTitle("");
        setContent("");
        setTags("");
        setIsAnonymous(false);
        setImageUrl("");
        setImagePreview("");

        // Redirect to home
        router.push("/");
      } else {
        let errorMessage = "Failed to create post";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("Error response:", errorData);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      showToast("Failed to create post. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="instagram-card p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Post</h1>

        {!chatroomActive && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">⚠️ Chatroom is currently offline. You cannot create posts at this time.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Write a caption..."
              required
              disabled={!chatroomActive}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add more details (optional)..."
              rows={4}
              disabled={!chatroomActive}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaImage className="text-[#DC143C]" /> Photo (Optional)
            </label>
            {!imagePreview ? (
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Client-side file size validation (max 5MB)
                  const maxSize = 5 * 1024 * 1024; // 5MB
                  if (file.size > maxSize) {
                    showToast('File size too large. Maximum size is 5MB. Please compress or choose a smaller image.', "error");
                    e.target.value = ''; // Clear the input
                    return;
                  }

                  setUploading(true);
                  try {
                    // Compress image if it's larger than 2MB
                    let fileToUpload = file;
                    if (file.size > 2 * 1024 * 1024) {
                      fileToUpload = await compressImage(file);
                    }

                    const formData = new FormData();
                    formData.append('file', fileToUpload);

                    const response = await fetch('/api/upload/contestant', {
                      method: 'POST',
                      body: formData,
                    });

                    if (response.ok) {
                      const data = await response.json();
                      setImageUrl(data.url);
                      setImagePreview(data.url);
                    } else {
                      const errorText = await response.text();
                      let error;
                      try {
                        error = JSON.parse(errorText);
                      } catch {
                        error = { error: `Server error (${response.status}). Image may be too large.` };
                      }
                      showToast(error.error || 'Failed to upload image', "error");
                    }
                  } catch (error: any) {
                    console.error('Error uploading image:', error);
                    if (error.message?.includes('413') || error.message?.includes('too large')) {
                      showToast('Image is too large. Please use a smaller image (max 5MB).', "error");
                    } else {
                      showToast('Failed to upload image. Please try again.', "error");
                    }
                  } finally {
                    setUploading(false);
                  }
                }}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                disabled={uploading || !chatroomActive}
              />
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setImagePreview("");
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            {uploading && (
              <p className="text-xs text-gray-500 mt-1">Uploading image...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="faith, prayer, community (comma-separated)"
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-[#DC143C] border-gray-300 rounded focus:ring-[#DC143C]"
            />
            <label htmlFor="anonymous" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <FaUserSecret className="text-[#DC143C]" />
              Post anonymously
            </label>
          </div>

          <button
            type="submit"
            disabled={!chatroomActive || uploading || submitting}
            className="w-full bg-[#DC143C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane /> {submitting ? "Posting..." : uploading ? "Uploading..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
}

