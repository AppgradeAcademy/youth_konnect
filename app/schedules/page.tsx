"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaBuilding, FaUser, FaUsers } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";

interface Schedule {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  organization: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    username: string | null;
  };
  tags: Array<{
    user: {
      id: string;
      name: string;
      username: string | null;
    };
  }>;
}

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      fetchSchedules(userObj.id);
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchSchedules = async (userId: string) => {
    try {
      const response = await fetch(`/api/schedules?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      showToast("Failed to load schedules", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">Loading schedules...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-20 md:pb-4">
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FaCalendarAlt className="text-[#DC143C]" />
          My Schedules
        </h1>
        <p className="text-gray-600">Schedules where you've been tagged</p>
      </div>

      {schedules.length === 0 ? (
        <div className="instagram-card p-8 text-center">
          <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50 text-gray-400" />
          <p className="text-gray-500">No schedules assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="instagram-card p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{schedule.title}</h2>
              {schedule.description && (
                <p className="text-gray-700 mb-3">{schedule.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
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
                <div className="flex items-center gap-1">
                  <FaBuilding />
                  <span 
                    className="hover:underline cursor-pointer"
                    onClick={() => router.push(`/organization/${schedule.organization.id}`)}
                  >
                    {schedule.organization.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FaUser />
                  <span>Created by {schedule.createdBy.name}</span>
                </div>
              </div>

              {schedule.tags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FaUsers />
                    <span className="font-semibold">Tagged ({schedule.tags.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {schedule.tags.map((tag) => (
                      <span
                        key={tag.user.id}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {tag.user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

