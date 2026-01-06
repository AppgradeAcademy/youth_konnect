"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaLock, FaUser, FaSignInAlt, FaVoteYea, FaPlus, FaTrash, FaChartBar, FaImage, FaEdit, FaUserCircle, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaTimes, FaPoll } from "react-icons/fa";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { votes: number };
}

interface Contestant {
  id: string;
  categoryId: string;
  name: string;
  surname: string;
  picture: string | null;
  createdAt: string;
  updatedAt: string | null;
  _count?: { votes: number };
}

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  place: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState("");
  const [contestants, setContestants] = useState<Record<string, Contestant[]>>({});
  const [showContestantForm, setShowContestantForm] = useState<Record<string, boolean>>({});
  const [newContestant, setNewContestant] = useState<Record<string, { name: string; surname: string; picture: string }>>({});
  const [editingContestant, setEditingContestant] = useState<Record<string, string | null>>({}); // categoryId -> contestantId
  const [uploadingImage, setUploadingImage] = useState<Record<string, boolean>>({});
  const [contestantImagePreview, setContestantImagePreview] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventPlace, setNewEventPlace] = useState("");
  const [activeSection, setActiveSection] = useState<"categories" | "events" | "results">("categories");
  const router = useRouter();

  // Admin credentials
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "AFMRzesow26";

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      fetchCategories();
      fetchEvents();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Trim whitespace from inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (trimmedUsername !== ADMIN_USERNAME || trimmedPassword !== ADMIN_PASSWORD) {
      setError("Invalid username or password.");
      return;
    }

    sessionStorage.setItem("adminAuth", "true");
    setIsAuthenticated(true);
    fetchCategories();
    fetchEvents();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?all=true");
      const data = await response.json();
      setCategories(data);
      // Fetch contestants for each category
      data.forEach((cat: Category) => {
        fetchContestants(cat.id);
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchContestants = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/contestants`);
      const data = await response.json();
      setContestants(prev => ({ ...prev, [categoryId]: data }));
    } catch (error) {
      console.error("Error fetching contestants:", error);
    }
  };

  const handleAddContestant = async (categoryId: string, e: React.FormEvent) => {
    e.preventDefault();
    const contestant = newContestant[categoryId];
    if (!contestant || !contestant.name || !contestant.surname) {
      alert("Please fill in name and surname");
      return;
    }

    const isEditing = editingContestant[categoryId];
    const url = isEditing 
      ? `/api/contestants/${isEditing}` 
      : `/api/categories/${categoryId}/contestants`;
    const method = isEditing ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contestant.name,
          surname: contestant.surname,
          picture: contestant.picture || null,
        }),
      });

      if (response.ok) {
        setNewContestant(prev => ({ ...prev, [categoryId]: { name: "", surname: "", picture: "" } }));
        setContestantImagePreview(prev => ({ ...prev, [categoryId]: "" }));
        setShowContestantForm(prev => ({ ...prev, [categoryId]: false }));
        setEditingContestant(prev => ({ ...prev, [categoryId]: null }));
        fetchContestants(categoryId);
      } else {
        alert(isEditing ? "Failed to update contestant" : "Failed to add contestant");
      }
    } catch (error) {
      console.error("Error saving contestant:", error);
      alert(isEditing ? "Failed to update contestant" : "Failed to add contestant");
    }
  };

  const handleEditContestant = (contestant: Contestant) => {
    setEditingContestant(prev => ({ ...prev, [contestant.categoryId]: contestant.id }));
    setNewContestant(prev => ({ 
      ...prev, 
      [contestant.categoryId]: { 
        name: contestant.name, 
        surname: contestant.surname, 
        picture: contestant.picture || "" 
      } 
    }));
    setContestantImagePreview(prev => ({ ...prev, [contestant.categoryId]: contestant.picture || "" }));
    setShowContestantForm(prev => ({ ...prev, [contestant.categoryId]: true }));
  };

  const handleCancelContestantEdit = (categoryId: string) => {
    setNewContestant(prev => ({ ...prev, [categoryId]: { name: "", surname: "", picture: "" } }));
    setContestantImagePreview(prev => ({ ...prev, [categoryId]: "" }));
    setShowContestantForm(prev => ({ ...prev, [categoryId]: false }));
    setEditingContestant(prev => ({ ...prev, [categoryId]: null }));
  };

  const handleDeleteContestant = async (contestantId: string, categoryId: string) => {
    if (!confirm("Are you sure you want to delete this contestant?")) return;

    try {
      const response = await fetch(`/api/contestants/${contestantId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchContestants(categoryId);
      } else {
        alert("Failed to delete contestant");
      }
    } catch (error) {
      console.error("Error deleting contestant:", error);
      alert("Failed to delete contestant");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDesc || null,
          imageUrl: newCategoryImageUrl || null,
        }),
      });

      if (response.ok) {
        setNewCategoryName("");
        setNewCategoryDesc("");
        setNewCategoryImageUrl("");
        fetchCategories();
      } else {
        alert("Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? This will also delete all votes for it.")) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
      } else {
        alert("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !category.isActive,
        }),
      });

      if (response.ok) {
        fetchCategories();
      } else {
        alert("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
      const method = editingEvent ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEventName,
          date: newEventDate,
          time: newEventTime,
          place: newEventPlace,
        }),
      });

      if (response.ok) {
        setNewEventName("");
        setNewEventDate("");
        setNewEventTime("");
        setNewEventPlace("");
        setShowEventForm(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        alert("Failed to save event");
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEventName(event.name);
    setNewEventDate(event.date.split('T')[0]); // Extract date part
    setNewEventTime(event.time);
    setNewEventPlace(event.place);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const handleCancelEventForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
    setNewEventName("");
    setNewEventDate("");
    setNewEventTime("");
    setNewEventPlace("");
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <FaLock className="text-3xl text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
          </div>
          
          {error && (
            <div className="glass bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FaUser /> Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 glass-card border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FaLock /> Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 glass-card border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaSignInAlt /> Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <FaChartBar className="text-3xl sm:text-4xl text-indigo-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage nominations and voting</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="glass bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            Logout
          </button>
        </div>

        {/* Menu Bar */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4 flex-wrap">
            <button
              onClick={() => setActiveSection("categories")}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeSection === "categories"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              <FaVoteYea className="inline mr-2" />
              Categories
            </button>
            <button
              onClick={() => setActiveSection("events")}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeSection === "events"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />
              Events
            </button>
            <button
              onClick={() => setActiveSection("results")}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeSection === "results"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              <FaPoll className="inline mr-2" />
              Poll Results
            </button>
          </nav>
        </div>

        {/* Categories Section */}
        {activeSection === "categories" && (
          <>
        {/* Add New Category Form */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 glass rounded-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaPlus /> Add New Nomination/Category
          </h2>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category/Nomination Name
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                placeholder="Enter category name..."
                className="w-full px-4 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="Enter description..."
                className="w-full px-4 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FaImage /> Image URL (Optional)
              </label>
              <input
                type="url"
                value={newCategoryImageUrl}
                onChange={(e) => setNewCategoryImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg or /images/nomination.jpg"
                className="w-full px-4 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a URL to an image, or a path like /images/nomination.jpg (place images in public/images/)
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaPlus /> {loading ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaVoteYea /> Current Categories/Nominations ({categories.length})
          </h2>
          
          {categories.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <FaVoteYea className="text-5xl sm:text-6xl mx-auto mb-4 opacity-50" />
              <p className="text-lg sm:text-xl">No categories yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="glass-card rounded-xl p-4 sm:p-6 border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {category.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full sm:w-32 h-32 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                            {category.name}
                          </h3>
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                              category.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {category.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      {category.description && (
                        <p className="text-sm sm:text-base text-gray-600 mb-3">{category.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-2">
                          <FaVoteYea /> {category._count.votes} votes
                        </span>
                        <span>
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            category.isActive
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {category.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="bg-red-100 text-red-800 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>

                      {/* Contestants Section */}
                      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                          <h4 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FaUserCircle /> Contestants ({contestants[category.id]?.length || 0})
                          </h4>
                          <button
                            onClick={() => {
                              if (showContestantForm[category.id]) {
                                handleCancelContestantEdit(category.id);
                              } else {
                                setShowContestantForm(prev => ({ ...prev, [category.id]: true }));
                              }
                            }}
                            className="bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center"
                          >
                            <FaPlus /> {showContestantForm[category.id] ? "Cancel" : "Add Contestant"}
                          </button>
                        </div>

                        {/* Add/Edit Contestant Form */}
                        {showContestantForm[category.id] && (
                          <form onSubmit={(e) => handleAddContestant(category.id, e)} className="mb-4 p-3 sm:p-4 glass rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-bold text-gray-800">
                                {editingContestant[category.id] ? "Edit Contestant" : "Add New Contestant"}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleCancelContestantEdit(category.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <FaTimes />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Name *
                                </label>
                                <input
                                  type="text"
                                  value={newContestant[category.id]?.name || ""}
                                  onChange={(e) => setNewContestant(prev => ({
                                    ...prev,
                                    [category.id]: { ...(prev[category.id] || { name: "", surname: "", picture: "" }), name: e.target.value }
                                  }))}
                                  required
                                  className="w-full px-3 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                  placeholder="First name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Surname *
                                </label>
                                <input
                                  type="text"
                                  value={newContestant[category.id]?.surname || ""}
                                  onChange={(e) => setNewContestant(prev => ({
                                    ...prev,
                                    [category.id]: { ...(prev[category.id] || { name: "", surname: "", picture: "" }), surname: e.target.value }
                                  }))}
                                  required
                                  className="w-full px-3 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                  placeholder="Last name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                  <FaImage className="text-xs" /> Picture
                                </label>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const categoryId = category.id;
                                    setUploadingImage(prev => ({ ...prev, [categoryId]: true }));

                                    try {
                                      const formData = new FormData();
                                      formData.append('file', file);

                                      const response = await fetch('/api/upload/contestant', {
                                        method: 'POST',
                                        body: formData,
                                      });

                                      if (response.ok) {
                                        const data = await response.json();
                                        setNewContestant(prev => ({
                                          ...prev,
                                          [categoryId]: { ...(prev[categoryId] || { name: "", surname: "", picture: "" }), picture: data.url }
                                        }));
                                        setContestantImagePreview(prev => ({ ...prev, [categoryId]: data.url }));
                                      } else {
                                        const error = await response.json();
                                        alert(error.error || 'Failed to upload image');
                                      }
                                    } catch (error) {
                                      console.error('Error uploading image:', error);
                                      alert('Failed to upload image. Please try again.');
                                    } finally {
                                      setUploadingImage(prev => ({ ...prev, [categoryId]: false }));
                                    }
                                  }}
                                  className="w-full px-3 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                  disabled={uploadingImage[category.id]}
                                />
                                {uploadingImage[category.id] && (
                                  <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                                )}
                                {contestantImagePreview[category.id] && (
                                  <div className="mt-2">
                                    <img
                                      src={contestantImagePreview[category.id]}
                                      alt="Preview"
                                      className="w-20 h-20 object-cover rounded-lg border-2 border-indigo-300"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                            >
                              {editingContestant[category.id] ? (
                                <>
                                  <FaEdit /> Update Contestant
                                </>
                              ) : (
                                <>
                                  <FaPlus /> Add Contestant
                                </>
                              )}
                            </button>
                          </form>
                        )}

                        {/* Contestants List */}
                        {contestants[category.id] && contestants[category.id].length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contestants[category.id].map((contestant) => (
                              <div key={contestant.id} className="glass-card rounded-lg p-4 flex gap-3">
                                {contestant.picture && (
                                  <img
                                    src={contestant.picture}
                                    alt={`${contestant.name} ${contestant.surname}`}
                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                {!contestant.picture && (
                                  <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FaUserCircle className="text-2xl text-indigo-600" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-gray-800 truncate">
                                    {contestant.name} {contestant.surname}
                                  </h5>
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => handleEditContestant(contestant)}
                                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                    >
                                      <FaEdit className="text-xs" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteContestant(contestant.id, category.id)}
                                      className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                    >
                                      <FaTrash className="text-xs" /> Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">No contestants added yet. Click "Add Contestant" to add one.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {/* Events Section */}
        {activeSection === "events" && (
          <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaCalendarAlt /> Events Management ({events.length})
            </h2>
            <button
              onClick={() => {
                handleCancelEventForm();
                setShowEventForm(!showEventForm);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
            >
              {showEventForm ? <FaTimes /> : <FaPlus />}
              {showEventForm ? "Cancel" : "Add Event"}
            </button>
          </div>

          {/* Add/Edit Event Form */}
          {showEventForm && (
            <form onSubmit={handleAddEvent} className="mb-6 p-4 glass rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {editingEvent ? "Edit Event" : "Add New Event"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    required
                    className="w-full px-3 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Event name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time * (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Place/Address *
                  </label>
                  <input
                    type="text"
                    value={newEventPlace}
                    onChange={(e) => setNewEventPlace(e.target.value)}
                    required
                    className="w-full px-3 py-2 glass-card border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Event location"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <FaPlus /> {loading ? "Saving..." : editingEvent ? "Update Event" : "Add Event"}
              </button>
            </form>
          )}

          {/* Events List */}
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaCalendarAlt className="text-5xl mx-auto mb-4 opacity-50" />
              <p className="text-lg">No events added yet. Click "Add Event" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((event) => (
                  <div key={event.id} className="glass-card rounded-lg p-4 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-3">{event.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-indigo-600" />
                            <span>{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock className="text-indigo-600" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-indigo-600" />
                            <span>{event.place}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        )}

        {/* Poll Results Section */}
        {activeSection === "results" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaPoll /> Poll Results & Statistics
              </h2>
              <p className="text-gray-600 mb-6">View detailed voting results for all categories and contestants.</p>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaVoteYea className="text-6xl mx-auto mb-4 opacity-50" />
                <p className="text-xl">No categories available. Add categories to view poll results.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryContestants = contestants[category.id] || [];
                  const totalVotes = category._count.votes;
                  
                  return (
                    <div key={category.id} className="glass-card rounded-xl p-4 sm:p-6 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{category.name}</h3>
                          {category.description && (
                            <p className="text-gray-600">{category.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-600">{totalVotes}</div>
                          <div className="text-sm text-gray-500">Total Votes</div>
                        </div>
                      </div>

                      {categoryContestants.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FaUserCircle className="text-4xl mx-auto mb-2 opacity-50" />
                          <p>No contestants in this category.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-700 mb-3">Contestant Results:</h4>
                          {categoryContestants.map((contestant) => {
                            const contestantVotes = contestant._count?.votes || 0;
                            const percentage = totalVotes > 0 ? ((contestantVotes / totalVotes) * 100).toFixed(1) : 0;

                            return (
                              <div key={contestant.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-4">
                                  {contestant.picture && (
                                    <img
                                      src={contestant.picture}
                                      alt={`${contestant.name} ${contestant.surname}`}
                                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  )}
                                  {!contestant.picture && (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <FaUserCircle className="text-2xl sm:text-3xl text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-lg font-bold text-gray-800 mb-2">
                                      {contestant.name} {contestant.surname}
                                    </h5>
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-600">Votes: {contestantVotes}</span>
                                        <span className="text-sm font-semibold text-indigo-600">{percentage}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                          className="bg-indigo-600 h-3 rounded-full transition-all"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
