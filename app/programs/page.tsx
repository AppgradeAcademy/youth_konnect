"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaBuilding, FaUser } from "react-icons/fa";

interface Program {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  date: string | null;
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
}

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/programs");
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">Loading programs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-20 md:pb-4">
      <div className="instagram-card p-4 sm:p-6 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FaCalendarAlt className="text-[#DC143C]" />
          Church Programs
        </h1>
        <p className="text-gray-600">Upcoming and ongoing church programs</p>
      </div>

      {programs.length === 0 ? (
        <div className="instagram-card p-8 text-center">
          <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50 text-gray-400" />
          <p className="text-gray-500">No programs available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => (
            <div key={program.id} className="instagram-card p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{program.title}</h2>
                  {program.description && (
                    <p className="text-gray-700 mb-3">{program.description}</p>
                  )}
                </div>
                {program.imageUrl && (
                  <img
                    src={program.imageUrl}
                    alt={program.title}
                    className="w-24 h-24 object-cover rounded-lg ml-4"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                {program.date && (
                  <div className="flex items-center gap-1">
                    <FaClock />
                    <span>{new Date(program.date).toLocaleDateString()}</span>
                  </div>
                )}
                {program.location && (
                  <div className="flex items-center gap-1">
                    <FaMapMarkerAlt />
                    <span>{program.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <FaBuilding />
                  <span 
                    className="hover:underline cursor-pointer"
                    onClick={() => router.push(`/organization/${program.organization.id}`)}
                  >
                    {program.organization.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FaUser />
                  <span>{program.createdBy.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

