"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaVoteYea, FaPlus, FaTimes, FaCheck, FaArrowLeft, FaUserCircle, FaLock } from "react-icons/fa";

interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  _count: { votes: number };
}

interface Contestant {
  id: string;
  categoryId: string;
  name: string;
  surname: string;
  picture: string | null;
  _count: { votes: number };
}

interface Vote {
  categoryId: string;
  contestantId: string;
}

export default function MyVote() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      fetchUserVotes();
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContestants = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/contestants`);
      const data = await response.json();
      setContestants(data);
    } catch (error) {
      console.error("Error fetching contestants:", error);
    }
  };

  const fetchUserVotes = async () => {
    const userData = localStorage.getItem("user");
    if (!userData) return;

    const user = JSON.parse(userData);
    try {
      const response = await fetch(`/api/votes?userId=${user.id}`);
      const votes: Vote[] = await response.json();
      setUserVotes(votes.map((v) => ({ categoryId: v.categoryId, contestantId: v.contestantId })));
    } catch (error) {
      console.error("Error fetching votes:", error);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    fetchContestants(category.id);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setContestants([]);
  };

  const handleVote = async (contestantId: string, categoryId: string) => {
    if (!user) {
      alert("Please log in to vote.");
      router.push("/login");
      return;
    }

    const hasVoted = userVotes.some(v => v.categoryId === categoryId);
    const currentVote = userVotes.find(v => v.categoryId === categoryId);

    try {
      // If user already voted in this category, this will replace the vote
      // The API handles deleting the old vote and creating a new one
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, categoryId, contestantId }),
      });

      if (response.ok) {
        // Update local state - remove old vote for this category, add new one
        const newVotes = userVotes.filter(v => v.categoryId !== categoryId);
        newVotes.push({ categoryId, contestantId });
        setUserVotes(newVotes);
        fetchContestants(categoryId);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to vote. Please try again.");
      }
    } catch (error: any) {
      console.error("Error voting:", error);
      alert("Failed to vote. Please try again.");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== "admin") {
      alert("Only admins can add categories");
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDesc || null,
        }),
      });

      if (response.ok) {
        setNewCategoryName("");
        setNewCategoryDesc("");
        setShowAddForm(false);
        fetchCategories();
      } else {
        alert("Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-xl text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="instagram-card p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <FaVoteYea className="text-4xl text-[#DC143C]" />
            <h1 className="text-4xl font-bold text-gray-800">MyVote</h1>
          </div>
          {user?.role === "admin" && !selectedCategory && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#DC143C] text-white px-4 py-2 rounded-lg hover:bg-[#B8122E] transition-colors flex items-center gap-2 font-semibold"
            >
              {showAddForm ? <FaTimes /> : <FaPlus />}
              {showAddForm ? "Cancel" : "Add Category"}
            </button>
          )}
        </div>

        {!user && (
          <div className="mb-6 p-4 instagram-card border border-amber-300 bg-amber-50">
            <div className="flex items-center gap-3 mb-3">
              <FaLock className="text-amber-600 text-xl" />
              <h3 className="text-lg font-semibold text-amber-800">Login Required to Vote</h3>
            </div>
            <p className="text-amber-700 mb-4">
              You must be logged in to vote. Please log in or create an account to participate.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#DC143C] text-white px-6 py-2 rounded-lg hover:bg-[#B8122E] transition-colors font-semibold"
            >
              Log In
            </Link>
          </div>
        )}

        {showAddForm && user?.role === "admin" && (
          <form onSubmit={handleAddCategory} className="mb-6 p-6 instagram-card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Category</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
              />
              <textarea
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
                rows={3}
              />
              <button
                type="submit"
                className="bg-[#DC143C] text-white px-6 py-2 rounded-lg hover:bg-[#B8122E] transition-colors font-semibold"
              >
                Add Category
              </button>
            </div>
          </form>
        )}

        {selectedCategory ? (
          <div>
            <button
              onClick={handleBackToCategories}
              className="mb-6 flex items-center gap-2 text-[#DC143C] hover:text-[#B8122E] font-semibold"
            >
              <FaArrowLeft /> Back to Categories
            </button>

            <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedCategory.name}</h2>
            {selectedCategory.description && (
              <p className="text-gray-600 mb-6">{selectedCategory.description}</p>
            )}

            {!user && (
              <div className="mb-6 p-4 glass bg-amber-50 border-amber-200 rounded-xl">
                <p className="text-amber-700 flex items-center gap-2">
                  <FaLock className="text-amber-600" />
                  <span>Please log in to vote for contestants in this category.</span>
                </p>
              </div>
            )}

            {contestants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaUserCircle className="text-6xl mx-auto mb-4 opacity-50" />
                <p className="text-xl">No contestants in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contestants.map((contestant) => {
                  const userVoteForCategory = userVotes.find(v => v.categoryId === contestant.categoryId);
                  const hasVoted = userVoteForCategory?.contestantId === contestant.id;
                  return (
                    <div
                      key={contestant.id}
                      className={`instagram-card p-5 transition-all ${
                        hasVoted
                          ? "border-2 border-[#DC143C]"
                          : "hover:border-[#DC143C]/50"
                      }`}
                    >
                      <div className="flex gap-4">
                        {contestant.picture && (
                          <div className="flex-shrink-0">
                            <img
                              src={contestant.picture}
                              alt={`${contestant.name} ${contestant.surname}`}
                              className="w-20 h-20 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {!contestant.picture && (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaUserCircle className="text-3xl text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">
                            {contestant.name} {contestant.surname}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mb-4">
                            <FaVoteYea /> {contestant._count.votes} vote{contestant._count.votes !== 1 ? "s" : ""}
                          </p>
                          {user ? (
                            <button
                              onClick={() => handleVote(contestant.id, contestant.categoryId)}
                              className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                                hasVoted
                                  ? "bg-[#DC143C] text-white hover:bg-[#B8122E]"
                                  : "bg-gray-100 text-[#DC143C] hover:bg-gray-200 border border-gray-300"
                              }`}
                            >
                              {hasVoted ? (
                                <>
                                  <FaCheck /> Voted
                                </>
                              ) : (
                                <>
                                  <FaVoteYea /> Vote
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-500 text-center text-sm">
                              Login to vote
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-6">
              {user
                ? "Click on a category to see contestants and vote. You can vote for one contestant per category."
                : "Click on a category to see contestants. Login is required to vote."}
            </p>

            {categories.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <FaVoteYea className="text-6xl mx-auto mb-4 opacity-50" />
                <p className="text-xl">No categories available yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="instagram-card p-5 cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex gap-4">
                      {category.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-24 h-24 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{category.name}</h3>
                        {category.description && (
                          <p className="text-gray-600 mb-3">{category.description}</p>
                        )}
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <FaVoteYea /> {category._count.votes} vote{category._count.votes !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
