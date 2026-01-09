"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaComments, FaPaperPlane, FaUser, FaEdit, FaCheck, FaTimes, FaUsers, FaSignInAlt, FaSignOutAlt, FaCircle } from "react-icons/fa";
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

interface Room {
  id: string;
  name: string;
  description: string | null;
  organization?: {
    id: string;
    name: string;
  };
  isMember: boolean;
  isPresent: boolean;
  memberCount: number;
  activeUsers: number;
  messageCount: number;
  chatroomSettings?: {
    isActive: boolean;
    requiresPassword: boolean;
  };
}

interface PresentUser {
  id: string;
  name: string;
  joinedAt: string;
  lastSeen: string;
}

export default function Chatroom() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'room'>('list'); // 'list' shows available rooms, 'room' shows messages
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
    fetchRooms();
    setLoading(false);
  }, [router]);

  // Cleanup: Leave room when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      if (user && currentRoomId) {
        leaveRoom(currentRoomId);
      }
    };
  }, [currentRoomId]);

  // Real-time updates when in a room
  useEffect(() => {
    if (user && currentRoomId && view === 'room') {
      fetchMessages();
      fetchPresentUsers();
      
      const interval = setInterval(() => {
        fetchMessages(); // This also updates lastSeen (heartbeat)
        fetchPresentUsers();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user, currentRoomId, view]);

  const fetchRooms = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/rooms?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setRooms(data);
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchPresentUsers = async () => {
    if (!currentRoomId) return;
    
    try {
      const response = await fetch(`/api/rooms/${currentRoomId}/presence`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setPresentUsers(data);
        }
      }
    } catch (error) {
      console.error("Error fetching present users:", error);
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
    if (!user || !currentRoomId) return;
    
    try {
      const response = await fetch(`/api/messages?userId=${user.id}&groupId=${currentRoomId}`);
      if (!response.ok) {
        if (response.status === 403) {
          const error = await response.json();
          // If user is not present, don't show error - just leave the room view
          if (error.error?.includes("join") || error.error?.includes("present")) {
            showToast("You must join the room to see messages", "info");
            setView('list');
            setCurrentRoomId(null);
            fetchRooms(); // Refresh to update presence status
          } else {
            showToast(error.error || "You don't have access to this chatroom", "error");
          }
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

  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setCurrentRoomId(roomId);
        setView('room');
        fetchRooms(); // Refresh to update isPresent status
        showToast("Joined room!", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to join room", "error");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      showToast("Failed to join room", "error");
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !currentRoomId) return;

    await leaveRoom(currentRoomId);
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) return;

    try {
      await fetch(`/api/rooms/${roomId}/presence?userId=${user.id}`, {
        method: "DELETE",
      });
      setCurrentRoomId(null);
      setView('list');
      setMessages([]);
      setPresentUsers([]);
      fetchRooms(); // Refresh to update isPresent status
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !currentRoomId) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: newMessage.trim(),
          groupId: currentRoomId,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
        fetchPresentUsers();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to send message", "error");
        
        // If error is "must join room", automatically join
        if (error.error?.includes("join")) {
          handleJoinRoom(currentRoomId);
        }
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

  const currentRoom = rooms.find(r => r.id === currentRoomId);

  // Room List View
  if (view === 'list') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 pb-20 md:pb-4">
        <div className="instagram-card p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <FaComments className="text-3xl text-[#DC143C]" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chatrooms</h1>
          </div>
          
          {/* Username Settings */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
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

        {/* Available Rooms List */}
        {rooms.length === 0 ? (
          <div className="instagram-card p-8 text-center">
            <FaComments className="text-4xl mx-auto mb-2 opacity-50 text-gray-400" />
            <p className="text-gray-500">No chatrooms available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.id} className="instagram-card p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                      {room.organization && (
                        <span className="text-sm text-gray-500">• {room.organization.name}</span>
                      )}
                    </div>
                    {room.description && (
                      <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FaUsers className="text-xs" />
                        <span>{room.activeUsers} active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaComments className="text-xs" />
                        <span>{room.memberCount} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{room.messageCount} messages</span>
                      </div>
                      {room.chatroomSettings && (
                        <div className={`flex items-center gap-1 ${
                          room.chatroomSettings.isActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <FaCircle className="text-xs" />
                          <span>{room.chatroomSettings.isActive ? 'Active' : 'Offline'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.isPresent ? (
                      <>
                        <span className="text-sm text-green-600 font-semibold">In Room</span>
                        <button
                          onClick={() => {
                            setCurrentRoomId(room.id);
                            setView('room');
                          }}
                          className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2"
                        >
                          <FaComments /> Open
                        </button>
                      </>
                    ) : room.isMember ? (
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={!room.chatroomSettings?.isActive}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaSignInAlt /> Join
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">Not a member</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Room View (showing messages)
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-20 md:pb-4">
      {/* Room Header */}
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleLeaveRoom();
              }}
              className="text-gray-500 hover:text-gray-700 mr-2"
            >
              ← Back
            </button>
            <FaComments className="text-3xl text-[#DC143C]" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{currentRoom?.name || 'Chatroom'}</h1>
              {currentRoom?.organization && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">{currentRoom.organization.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaCircle className="text-xs text-green-500" />
              <span>{presentUsers.length} active</span>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FaSignOutAlt /> Leave
            </button>
          </div>
        </div>

        {/* Who's Present */}
        {presentUsers.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaUsers className="text-sm text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Active Now:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presentUsers.map((presentUser) => (
                <div
                  key={presentUser.id}
                  className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-sm text-gray-700"
                >
                  <FaCircle className="text-xs text-green-500" />
                  <span>{presentUser.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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

        {currentRoom?.chatroomSettings && !currentRoom.chatroomSettings.isActive && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">⚠️ Chatroom is currently offline. You can view messages but cannot send new ones.</p>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={currentRoom?.chatroomSettings?.isActive ? "Type your message..." : "Chatroom is offline"}
            disabled={!currentRoom?.chatroomSettings?.isActive}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!currentRoom?.chatroomSettings?.isActive}
            className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
