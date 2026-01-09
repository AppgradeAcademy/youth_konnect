"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaComments, FaPaperPlane, FaUser, FaEdit, FaCheck, FaTimes, FaUsers } from "react-icons/fa";
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
    role: string;
  };
  group?: {
    id: string;
    name: string;
    organization?: {
      id: string;
      name: string;
    };
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  organization?: {
    id: string;
    name: string;
  };
  membershipRole: string;
  memberCount: number;
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
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
    fetchUserGroups();
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (user && selectedGroupId) {
      fetchChatroomStatus();
      fetchMessages();
      const interval = setInterval(() => {
        fetchChatroomStatus();
        fetchMessages();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user, selectedGroupId]);

  const fetchUserGroups = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/groups/user?userId=${user.id}`);
      if (response.ok) {
        const userGroups = await response.json();
        if (Array.isArray(userGroups) && userGroups.length > 0) {
          setGroups(userGroups);
          // Auto-select first group (usually "Youth Connect")
          if (!selectedGroupId) {
            setSelectedGroupId(userGroups[0].id);
          }
        } else {
          showToast("You are not a member of any groups yet", "info");
        }
      }
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  };

  const fetchChatroomStatus = async () => {
    if (!selectedGroupId) return;
    
    try {
      const response = await fetch(`/api/chatroom/status?groupId=${selectedGroupId}`);
      if (response.ok) {
        const data = await response.json();
        setChatroomActive(data.isActive);
      }
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
    if (!user || !selectedGroupId) return;
    
    try {
      const response = await fetch(`/api/messages?userId=${user.id}&groupId=${selectedGroupId}`);
      if (!response.ok) {
        if (response.status === 403) {
          const error = await response.json();
          showToast(error.error || "You don't have access to this chatroom", "error");
          setMessages([]);
          return;
        }
        console.error("Failed to fetch messages:", response.status);
        setMessages([]);
        return;
      }
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        console.error("Invalid messages data format:", data);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
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
    if (!newMessage.trim() || !user || !selectedGroupId) return;
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
          groupId: selectedGroupId,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to send message", "error");
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
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chatroom</h1>
              {selectedGroupId && groups.find(g => g.id === selectedGroupId) && (
                <div className="flex items-center gap-2 mt-1">
                  <FaUsers className="text-sm text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {groups.find(g => g.id === selectedGroupId)?.name}
                    {groups.find(g => g.id === selectedGroupId)?.organization && (
                      <span className="text-gray-400"> • {groups.find(g => g.id === selectedGroupId)?.organization?.name}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
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

        {/* Group Selector */}
        {groups.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Group:</label>
            <select
              value={selectedGroupId || ""}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} {group.organization && `(${group.organization.name})`} - {group.memberCount} members
                </option>
              ))}
            </select>
          </div>
        )}

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

      </div>

      {/* Messages */}
      {selectedGroupId ? (
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
                      {message.user.role === 'admin' && (
                        <span className="text-xs bg-[#DC143C] text-white px-2 py-0.5 rounded">Admin</span>
                      )}
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
      ) : (
        <div className="instagram-card p-4 sm:p-6 mb-4 text-center">
          <FaComments className="text-4xl mx-auto mb-2 opacity-50 text-gray-400" />
          <p className="text-gray-500">
            {groups.length === 0 
              ? "You are not a member of any groups yet." 
              : "Please select a group to view messages."}
          </p>
        </div>
      )}
    </div>
  );
}
