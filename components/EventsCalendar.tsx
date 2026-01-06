"use client";

import { useEffect, useState } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock } from "react-icons/fa";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  place: string;
  createdAt: string;
  updatedAt: string;
}

export default function EventsCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isUpcoming = (dateString: string) => {
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  const upcomingEvents = events.filter((event) => isUpcoming(event.date));
  const sortedEvents = upcomingEvents.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (loading) {
    return (
      <div className="instagram-card p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <FaCalendarAlt className="text-3xl sm:text-4xl text-[#DC143C]" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Upcoming Events</h2>
        </div>
        <p className="text-gray-600">Loading events...</p>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="instagram-card p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <FaCalendarAlt className="text-3xl sm:text-4xl text-[#DC143C]" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Upcoming Events</h2>
        </div>
        <p className="text-gray-600">No upcoming events scheduled.</p>
      </div>
    );
  }

  return (
    <div className="instagram-card p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <FaCalendarAlt className="text-3xl sm:text-4xl text-[#DC143C]" />
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Upcoming Events</h2>
      </div>
      <div className="space-y-4">
        {sortedEvents.slice(0, 5).map((event) => (
          <div
            key={event.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-[#DC143C]/50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">{event.name}</h3>
              <div className="flex items-center gap-2 text-sm text-[#DC143C] font-semibold">
                <FaCalendarAlt className="text-sm" />
                <span>{formatDate(event.date)}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaClock className="text-[#DC143C]" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-[#DC143C]" />
                <span>{event.place}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


