"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChurch, FaUsers, FaCalendarAlt, FaBullhorn, FaPlus, FaEdit, FaTrash, FaTimes, FaUserPlus, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  _count: {
    leaders: number;
    events: number;
    schedules: number;
    announcements: number;
  };
}

interface Leader {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  };
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  imageUrl: string | null;
}

interface Schedule {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  tags: Array<{ user: { id: string; name: string } }>;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

type Tab = "leaders" | "events" | "calendar" | "announcements";

export default function ChurchDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("leaders");
  const [loading, setLoading] = useState(true);

  // Leaders
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [newLeaderEmail, setNewLeaderEmail] = useState("");
  const [addingLeader, setAddingLeader] = useState(false);

  // Events
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");

  // Schedules (Calendar)
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newScheduleDescription, setNewScheduleDescription] = useState("");
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [newScheduleLocation, setNewScheduleLocation] = useState("");

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    
    if (userObj.role !== "admin") {
      router.push("/");
      return;
    }
    
    fetchOrganization(userObj.id);
  }, [router]);

  useEffect(() => {
    if (organization) {
      fetchLeaders();
      fetchEvents();
      fetchSchedules();
      fetchAnnouncements();
    }
  }, [organization, activeTab]);

  const fetchOrganization = async (userId: string) => {
    try {
      const response = await fetch(`/api/organizations/my-organization?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
      } else {
        showToast("No organization found. Please register a church first.", "error");
        router.push("/register/church");
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      showToast("Failed to load organization", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaders = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/organizations/${organization.id}/leaders`);
      if (response.ok) {
        const data = await response.json();
        setLeaders(data);
      }
    } catch (error) {
      console.error("Error fetching leaders:", error);
    }
  };

  const fetchEvents = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/events?organizationId=${organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchSchedules = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/schedules?organizationId=${organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchAnnouncements = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/announcements?organizationId=${organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const handleAddLeader = async () => {
    if (!organization || !newLeaderEmail.trim()) return;
    setAddingLeader(true);
    try {
      // Use the users search API to find user by email
      const userResponse = await fetch(`/api/users/search?query=${encodeURIComponent(newLeaderEmail)}`);
      if (!userResponse.ok) {
        showToast("Failed to search for user", "error");
        return;
      }
      const users = await userResponse.json();
      const foundUser = Array.isArray(users) ? users.find((u: any) => u.email?.toLowerCase() === newLeaderEmail.toLowerCase()) : null;
      if (!foundUser) {
        showToast("User not found with that email", "error");
        return;
      }

      const response = await fetch(`/api/organizations/${organization.id}/leaders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: foundUser.id, adminId: user?.id }),
      });

      if (response.ok) {
        showToast("Leader added successfully", "success");
        setNewLeaderEmail("");
        fetchLeaders();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to add leader", "error");
      }
    } catch (error) {
      console.error("Error adding leader:", error);
      showToast("Failed to add leader", "error");
    } finally {
      setAddingLeader(false);
    }
  };

  const handleDeleteLeader = async (userId: string) => {
    if (!organization || !confirm("Remove this leader?")) return;
    try {
      const response = await fetch(`/api/organizations/${organization.id}/leaders/${userId}?adminId=${user?.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showToast("Leader removed", "success");
        fetchLeaders();
      }
    } catch (error) {
      console.error("Error removing leader:", error);
      showToast("Failed to remove leader", "error");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          title: newEventTitle,
          description: newEventDescription,
          date: newEventDate,
          location: newEventLocation,
          createdById: user?.id,
        }),
      });

      if (response.ok) {
        showToast("Event created", "success");
        setShowEventForm(false);
        setNewEventTitle("");
        setNewEventDescription("");
        setNewEventDate("");
        setNewEventLocation("");
        fetchEvents();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to create event", "error");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      showToast("Failed to create event", "error");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      const response = await fetch(`/api/events/${eventId}?userId=${user?.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showToast("Event deleted", "success");
        fetchEvents();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast("Failed to delete event", "error");
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          title: newScheduleTitle,
          description: newScheduleDescription,
          date: newScheduleDate,
          location: newScheduleLocation,
          createdById: user?.id,
          taggedUserIds: [], // Can be enhanced later to allow tagging
        }),
      });

      if (response.ok) {
        showToast("Schedule created", "success");
        setShowScheduleForm(false);
        setNewScheduleTitle("");
        setNewScheduleDescription("");
        setNewScheduleDate("");
        setNewScheduleLocation("");
        fetchSchedules();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to create schedule", "error");
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      showToast("Failed to create schedule", "error");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      const response = await fetch(`/api/schedules/${scheduleId}?userId=${user?.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showToast("Schedule deleted", "success");
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      showToast("Failed to delete schedule", "error");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          title: newAnnouncementTitle,
          content: newAnnouncementContent,
          createdById: user?.id,
        }),
      });

      if (response.ok) {
        showToast("Announcement created", "success");
        setShowAnnouncementForm(false);
        setNewAnnouncementTitle("");
        setNewAnnouncementContent("");
        fetchAnnouncements();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to create announcement", "error");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      showToast("Failed to create announcement", "error");
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const response = await fetch(`/api/announcements/${announcementId}?userId=${user?.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showToast("Announcement deleted", "success");
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      showToast("Failed to delete announcement", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-20 md:pb-4">
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <FaChurch className="text-3xl text-[#DC143C]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{organization.name}</h1>
            {organization.description && (
              <p className="text-gray-600">{organization.description}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("leaders")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "leaders"
                ? "text-[#DC143C] border-b-2 border-[#DC143C]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaUsers className="inline mr-2" />
            Leaders ({organization._count.leaders})
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "events"
                ? "text-[#DC143C] border-b-2 border-[#DC143C]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaCalendarAlt className="inline mr-2" />
            Events ({organization._count.events})
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "calendar"
                ? "text-[#DC143C] border-b-2 border-[#DC143C]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaCalendarAlt className="inline mr-2" />
            Calendar ({organization._count.schedules})
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "announcements"
                ? "text-[#DC143C] border-b-2 border-[#DC143C]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaBullhorn className="inline mr-2" />
            Announcements ({organization._count.announcements})
          </button>
        </div>
      </div>

      {/* Leaders Tab */}
      {activeTab === "leaders" && (
        <div className="instagram-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Leaders</h2>
            <button
              onClick={() => setNewLeaderEmail("")}
              className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2"
            >
              <FaUserPlus /> Add Leader
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {leaders.map((leader) => (
              <div key={leader.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{leader.user.name}</p>
                  <p className="text-sm text-gray-600">{leader.user.email}</p>
                </div>
                <button
                  onClick={() => handleDeleteLeader(leader.user.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          {newLeaderEmail !== "" && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <input
                type="email"
                value={newLeaderEmail}
                onChange={(e) => setNewLeaderEmail(e.target.value)}
                placeholder="Leader email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddLeader}
                  disabled={addingLeader}
                  className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setNewLeaderEmail("")}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="instagram-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Events</h2>
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2"
            >
              <FaPlus /> {showEventForm ? "Cancel" : "Add Event"}
            </button>
          </div>

          {showEventForm && (
            <form onSubmit={handleCreateEvent} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Event Title *"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="datetime-local"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
                placeholder="Location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="submit"
                className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors"
              >
                Create Event
              </button>
            </form>
          )}

          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                    {event.description && (
                      <p className="text-gray-700 mb-2">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FaClock />
                        <span>{new Date(event.date).toLocaleString()}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-red-600 hover:text-red-800 ml-4"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="instagram-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Calendar / Schedules</h2>
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2"
            >
              <FaPlus /> {showScheduleForm ? "Cancel" : "Add Schedule"}
            </button>
          </div>

          {showScheduleForm && (
            <form onSubmit={handleCreateSchedule} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <input
                type="text"
                value={newScheduleTitle}
                onChange={(e) => setNewScheduleTitle(e.target.value)}
                placeholder="Schedule Title *"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                value={newScheduleDescription}
                onChange={(e) => setNewScheduleDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="datetime-local"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                value={newScheduleLocation}
                onChange={(e) => setNewScheduleLocation(e.target.value)}
                placeholder="Location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="submit"
                className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors"
              >
                Create Schedule
              </button>
            </form>
          )}

          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{schedule.title}</h3>
                    {schedule.description && (
                      <p className="text-gray-700 mb-2">{schedule.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FaClock />
                        <span>{new Date(schedule.date).toLocaleString()}</span>
                      </div>
                      {schedule.location && (
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt />
                          <span>{schedule.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="text-red-600 hover:text-red-800 ml-4"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === "announcements" && (
        <div className="instagram-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
            <button
              onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors flex items-center gap-2"
            >
              <FaPlus /> {showAnnouncementForm ? "Cancel" : "Add Announcement"}
            </button>
          </div>

          {showAnnouncementForm && (
            <form onSubmit={handleCreateAnnouncement} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <input
                type="text"
                value={newAnnouncementTitle}
                onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                placeholder="Announcement Title *"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                value={newAnnouncementContent}
                onChange={(e) => setNewAnnouncementContent(e.target.value)}
                placeholder="Content *"
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="submit"
                className="bg-[#DC143C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#B8122E] transition-colors"
              >
                Create Announcement
              </button>
            </form>
          )}

          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                    <p className="text-gray-700 mb-2">{announcement.content}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="text-red-600 hover:text-red-800 ml-4"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

