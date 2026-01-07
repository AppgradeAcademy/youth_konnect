"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaComments, FaPaperPlane, FaUser, FaEdit, FaCheck, FaTimes, FaFilter } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";

interface Message {
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

export default function Chatroom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [chatroomActive, setChatroomActive] = useState(true);
  const [filter, setFilter] = useState<'all' | 'followingAndChurch' | 'mine' | 'following' | 'church'>('followingAndChurch');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    setNewUsername(userObj.username || "");
    fetchChatroomStatus();
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchMessages();
      const interval = setInterval(() => {
        fetchChatroomStatus();
        fetchMessages();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user, filter]);

  const fetchChatroomStatus = async () => {
    try {
      const response = await fetch("/api/chatroom/status");
      const data = await response.json();
      setChatroomActive(data.isActive);
    } catch (error) {
      console.error("Error fetching chatroom status:", error);
    }
  };

  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        scrollToBottom();
      }
    } else {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/messages?userId=${user.id}&filter=${filter}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleUpdateUsername = async () => {
    if (!user) return;
    
    setEditingUsername(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setShowUsernameEdit(false);
        showToast("Username updated!", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to update username", "error");
      }
    } catch (error) {
      console.error("Error updating username:", error);
      showToast("Failed to update username", "error");
    } finally {
      setEditingUsername(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    if (!chatroomActive) {
      showToast("Chatroom is currently offline. Please try again later.", "error");
      return;
    }

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      } else {
        showToast("Failed to send message", "error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("Failed to send message", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const displayName = (messageUser: Message["user"]) => {
    return messageUser.username || messageUser.name;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-20 md:pb-4">
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <FaComments className="text-3xl text-[#DC143C]" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chatroom</h1>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
            chatroomActive 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            <div className={`w-2 h-2 rounded-full ${chatroomActive ? "bg-green-600" : "bg-red-600"}`}></div>
            {chatroomActive ? "Active" : "Offline"}
          </div>
        </div>

        {/* Username Settings */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          {!showUsernameEdit ? (
            <>
              <span className="text-sm text-gray-600">
                Chat as: <strong>{user?.username || user?.name}</strong>
              </span>
              <button
                onClick={() => setShowUsernameEdit(true)}
                className="text-sm text-[#DC143C] hover:text-[#B8122E] flex items-center gap-1"
              >
                <FaEdit className="text-xs" /> Edit
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username (optional)"
                className="flex-1 sm:flex-initial px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                disabled={editingUsername}
              />
              <button
                onClick={handleUpdateUsername}
                disabled={editingUsername}
                className="text-[#DC143C] hover:text-[#B8122E] disabled:opacity-50"
              >
                <FaCheck />
              </button>
              <button
                onClick={() => {
                  setShowUsernameEdit(false);
                  setNewUsername(user?.username || "");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-4 border-b border-gray-200">
          <button
            onClick={() => setFilter('followingAndChurch')}
            className={`px-3 py-1 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
              filter === 'followingAndChurch'
                ? 'bg-[#DC143C] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Following & Church
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-3 py-1 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
              filter === 'mine'
                ? 'bg-[#DC143C] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Messages
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`px-3 py-1 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
              filter === 'following'
                ? 'bg-[#DC143C] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setFilter('church')}
            className={`px-3 py-1 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
              filter === 'church'
                ? 'bg-[#DC143C] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Church Only
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-[#DC143C] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <div className="max-h-96 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#DC143C] to-[#B8122E] flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {(displayName(message.user)[0] || "U").toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">
                      {displayName(message.user)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {!chatroomActive && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">⚠️ Chatroom is currently offline. You can view messages but cannot send new ones.</p>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={chatroomActive ? "Type your message..." : "Chatroom is offline"}
            disabled={!chatroomActive}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!chatroomActive}
            className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
