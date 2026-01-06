import Link from "next/link";
import { FaVoteYea, FaComments, FaInfoCircle, FaArrowRight } from "react-icons/fa";
import Banner from "@/components/Banner";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Welcome Section */}
      <div className="instagram-card p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-[#DC143C] to-[#B8122E] bg-clip-text text-transparent">
          Welcome to Youth Connect
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-2">AFM Rzeszow</p>
        <p className="text-sm sm:text-base text-gray-500">
          Connect, vote, chat, and grow together in faith
        </p>
      </div>

      {/* Feature Cards - Instagram Style Grid */}
      <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Link href="/myvote">
          <div className="instagram-card p-4 sm:p-6 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="bg-gradient-to-br from-[#DC143C] to-[#B8122E] p-3 sm:p-4 rounded-xl group-hover:shadow-lg transition-shadow flex-shrink-0">
                <FaVoteYea className="text-2xl sm:text-3xl text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">MyVote</h2>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Cast your vote on various categories and topics. Your voice matters!
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end text-[#DC143C] font-semibold group-hover:gap-3 transition-all gap-2">
              <span className="text-sm sm:text-base">Explore</span>
              <FaArrowRight className="text-sm" />
            </div>
          </div>
        </Link>

        <Link href="/chatroom">
          <div className="instagram-card p-4 sm:p-6 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="bg-gradient-to-br from-[#003F7F] to-[#002952] p-3 sm:p-4 rounded-xl group-hover:shadow-lg transition-shadow flex-shrink-0">
                <FaComments className="text-2xl sm:text-3xl text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Chatroom</h2>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Join the conversation, share thoughts, and ask questions in real-time.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end text-[#003F7F] font-semibold group-hover:gap-3 transition-all gap-2">
              <span className="text-sm sm:text-base">Join Chat</span>
              <FaArrowRight className="text-sm" />
            </div>
          </div>
        </Link>

        <Link href="/about" className="sm:col-span-1 md:col-span-2">
          <div className="instagram-card p-4 sm:p-6 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="bg-gradient-to-br from-[#DC143C] to-[#003F7F] p-3 sm:p-4 rounded-xl group-hover:shadow-lg transition-shadow flex-shrink-0">
                <FaInfoCircle className="text-2xl sm:text-3xl text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">About Us</h2>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Learn more about our community, mission, and values. Get to know AFM Rzeszow.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end text-[#DC143C] font-semibold group-hover:gap-3 transition-all gap-2">
              <span className="text-sm sm:text-base">Learn More</span>
              <FaArrowRight className="text-sm" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
