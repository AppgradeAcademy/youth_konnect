"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaComments, FaQuestionCircle, FaPaperPlane, FaUser, FaEdit, FaUserSecret, FaCheck, FaTimes, FaTag, FaReply } from "react-icons/fa";
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

interface Answer {
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

interface Question {
  id: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  tags: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  answers?: Answer[];
  _count?: { answers: number };
}

export default function Chatroom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [newQuestionTags, setNewQuestionTags] = useState("");
  const [isQuestionAnonymous, setIsQuestionAnonymous] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState<Record<string, string>>({});
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "questions">("chat");
  const [loading, setLoading] = useState(true);
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [chatroomActive, setChatroomActive] = useState(true);
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
    fetchMessages();
    fetchQuestions();
    setLoading(false);

    const interval = setInterval(() => {
      fetchChatroomStatus();
      fetchMessages();
      fetchQuestions();
    }, 3000);

    return () => clearInterval(interval);
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
    try {
      const response = await fetch("/api/messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/questions");
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Error fetching questions:", error);
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
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update username");
      }
    } catch (error) {
      console.error("Error updating username:", error);
      alert("Failed to update username");
    } finally {
      setEditingUsername(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      } else {
        alert("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionTitle.trim() || !newQuestionContent.trim() || !user) return;

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: newQuestionTitle,
          content: newQuestionContent,
          isAnonymous: isQuestionAnonymous,
          tags: newQuestionTags.trim() || null,
        }),
      });

      if (response.ok) {
        setNewQuestionTitle("");
        setNewQuestionContent("");
        setNewQuestionTags("");
        setIsQuestionAnonymous(false);
        fetchQuestions();
        setActiveTab("questions");
        showToast("Question submitted successfully!", "success");
      } else {
        showToast("Failed to submit question", "error");
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      alert("Failed to submit question");
    }
  };

  const handleSubmitAnswer = async (questionId: string, e: React.FormEvent) => {
    e.preventDefault();
    const answerContent = newAnswer[questionId];
    if (!answerContent?.trim() || !user) return;

    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: answerContent,
        }),
      });

      if (response.ok) {
        setNewAnswer(prev => ({ ...prev, [questionId]: "" }));
        setAnsweringQuestion(null);
        fetchQuestions();
      } else {
        alert("Failed to submit answer");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer");
    }
  };

  const displayAnswerName = (user: { name: string; username: string | null }) => {
    return user.username || user.name;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const displayName = (messageUser: Message["user"]) => {
    return messageUser.username || messageUser.name;
  };


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="instagram-card p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <FaComments className="text-3xl sm:text-4xl text-[#DC143C]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Chatroom</h1>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
            chatroomActive 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            <div className={`w-2 h-2 rounded-full ${chatroomActive ? "bg-green-600" : "bg-red-600"}`}></div>
            {chatroomActive ? "Active" : "Offline"}
          </div>
          
          {/* Username Settings */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {!showUsernameEdit ? (
              <>
                <span className="text-xs sm:text-sm text-gray-600">
                  Chat as: <strong>{user?.username || user?.name}</strong>
                </span>
                <button
                  onClick={() => setShowUsernameEdit(true)}
                  className="text-xs sm:text-sm text-[#DC143C] hover:text-[#B8122E] flex items-center gap-1"
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab("chat")}
            className={`pb-2 px-4 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "chat"
                ? "text-[#DC143C] border-b-2 border-[#DC143C]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaComments /> Chat
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`pb-2 px-4 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "questions"
                ? "text-[#DC143C] border-b-2 border-[#DC143C]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaQuestionCircle /> Questions
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-[400px] sm:h-[500px] md:h-[600px]">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 sm:space-y-6">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Be the first to start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="instagram-card"
                  >
                    {/* Header - User info */}
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#DC143C] to-[#003F7F] flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm sm:text-base">
                          {(displayName(message.user).charAt(0)).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-sm sm:text-base text-gray-900 block truncate">
                            {displayName(message.user)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="px-3 sm:px-4 py-3 sm:py-4">
                      <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    
                    {/* Footer - Like/Comment area (Instagram style) */}
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="text-sm font-semibold">
                          {message.user.id === user?.id ? "You" : displayName(message.user)}
                        </span>
                      </div>
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
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!chatroomActive}
                className="bg-[#DC143C] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="text-sm" /> <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div>
            <form
              onSubmit={handleSubmitQuestion}
              className="mb-4 sm:mb-6 p-4 sm:p-6 instagram-card"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaQuestionCircle className="text-[#DC143C]" /> Ask a Question
                </h2>
                {!chatroomActive && (
                  <span className="text-xs text-red-600 font-semibold">(Offline)</span>
                )}
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  placeholder={chatroomActive ? "Question title..." : "Chatroom is offline"}
                  required
                  disabled={!chatroomActive}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <textarea
                  value={newQuestionContent}
                  onChange={(e) => setNewQuestionContent(e.target.value)}
                  placeholder="Question details..."
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                />
                <input
                  type="text"
                  value={newQuestionTags}
                  onChange={(e) => setNewQuestionTags(e.target.value)}
                  placeholder="Tags (comma-separated, e.g., faith, prayer, community)"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isQuestionAnonymous}
                    onChange={(e) => setIsQuestionAnonymous(e.target.checked)}
                    className="w-4 h-4 text-[#DC143C] border-gray-300 rounded focus:ring-[#DC143C]"
                  />
                  <label htmlFor="anonymous" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <FaUserSecret className="text-[#DC143C]" />
                    Post anonymously
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!chatroomActive}
                  className="bg-[#DC143C] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane /> Submit Question
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FaQuestionCircle className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>No questions yet. Be the first to ask!</p>
                </div>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="instagram-card p-4 sm:p-6"
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-1">
                        {question.title}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDate(question.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mb-3">{question.content}</p>
                    
                    {/* Tags */}
                    {question.tags && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {question.tags.split(',').map((tag, idx) => (
                          tag.trim() && (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#DC143C]/10 text-[#DC143C] rounded-full text-xs font-medium"
                            >
                              <FaTag className="text-xs" />
                              {tag.trim()}
                            </span>
                          )
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <FaUser /> Asked by:{" "}
                        {question.user ? (
                          question.user.name
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaUserSecret className="text-[#DC143C]" />
                            Anonymous
                          </span>
                        )}
                      </p>
                      {question._count && question._count.answers > 0 && (
                        <span className="text-sm text-gray-500">
                          {question._count.answers} {question._count.answers === 1 ? 'answer' : 'answers'}
                        </span>
                      )}
                    </div>

                    {/* Answers */}
                    {question.answers && question.answers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Answers:</h4>
                        {question.answers.map((answer) => (
                          <div key={answer.id} className="pl-4 border-l-2 border-[#DC143C]/30">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {displayAnswerName(answer.user)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(answer.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{answer.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer Form */}
                    {answeringQuestion === question.id ? (
                      <form
                        onSubmit={(e) => handleSubmitAnswer(question.id, e)}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <textarea
                          value={newAnswer[question.id] || ""}
                          onChange={(e) => setNewAnswer(prev => ({ ...prev, [question.id]: e.target.value }))}
                          placeholder="Type your answer..."
                          required
                          rows={3}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2 text-sm"
                          >
                            <FaPaperPlane /> Submit Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAnsweringQuestion(null);
                              setNewAnswer(prev => ({ ...prev, [question.id]: "" }));
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setAnsweringQuestion(question.id)}
                        className="mt-3 text-[#DC143C] hover:text-[#B8122E] flex items-center gap-2 text-sm font-semibold"
                      >
                        <FaReply /> Answer this question
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
