"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaChurch, FaBuilding, FaEnvelope, FaLock, FaArrowRight, FaUser } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";

export default function RegisterChurch() {
  const [churchName, setChurchName] = useState("");
  const [description, setDescription] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First, check if user exists
      let adminUserId;
      
      try {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          adminUserId = loginData.user.id;
          
          // Update user role to admin if not already
          if (loginData.user.role !== "admin") {
            await fetch(`/api/users/${adminUserId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role: "admin" }),
            });
          }
        } else {
          // User doesn't exist, create admin user via register API (will create as user)
          const registerResponse = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: adminName,
              email: adminEmail,
              password: adminPassword,
            }),
          });

          if (!registerResponse.ok) {
            const errorData = await registerResponse.json();
            throw new Error(errorData.error || "Failed to create admin account");
          }

          const registerData = await registerResponse.json();
          
          // Update user role to admin
          const updateResponse = await fetch(`/api/users/${registerData.userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "admin" }),
          });

          if (!updateResponse.ok) {
            throw new Error("Failed to set admin role");
          }

          adminUserId = registerData.userId;
        }
      } catch (err: any) {
        throw new Error(err.message || "Failed to create/admin account");
      }

      // Create organization
      const orgResponse = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: churchName,
          description: description || null,
          ownerId: adminUserId,
        }),
      });

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json();
        throw new Error(errorData.error || "Failed to register church");
      }

      showToast("Church registered successfully! You can now log in.", "success");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      showToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 sm:mt-12 px-4">
      <div className="instagram-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <FaChurch className="text-2xl sm:text-3xl text-[#DC143C]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Register Church</h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Church Information */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBuilding /> Church Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="churchName" className="block text-sm font-medium text-gray-700 mb-1">
                  Church Name *
                </label>
                <input
                  type="text"
                  id="churchName"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                  placeholder="e.g., AFM Rzeszow"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                  placeholder="Brief description of your church..."
                />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUser /> Admin Account
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Create an admin account to manage your church. You can add leaders later.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaUser /> Admin Name *
                </label>
                <input
                  type="text"
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                />
              </div>

              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaEnvelope /> Admin Email *
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaLock /> Admin Password *
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#DC143C] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#B8122E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Registering..." : (
              <>
                Register Church <FaArrowRight />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-[#DC143C] hover:text-[#B8122E] font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

