import { FaInfoCircle, FaChurch, FaUsers, FaBullhorn, FaEnvelope } from "react-icons/fa";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FaInfoCircle className="text-3xl sm:text-4xl text-indigo-600" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">About Us</h1>
        </div>
        
        <div className="space-y-6 sm:space-y-8 text-gray-700">
          <section className="glass rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaChurch className="text-xl sm:text-2xl text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">AFM Rzeszow</h2>
            </div>
            <p className="text-base sm:text-lg leading-relaxed">
              Welcome to AFM Rzeszow, a vibrant community of believers dedicated to growing in faith,
              serving our community, and building meaningful relationships. Our church is committed to
              creating spaces where young people can connect, learn, and thrive in their spiritual journey.
            </p>
          </section>

          <section className="glass rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaUsers className="text-xl sm:text-2xl text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Verse Platform</h2>
            </div>
            <p className="text-base sm:text-lg leading-relaxed">
              Verse is our dedicated platform designed to bring our church youth community together.
              This platform enables members to engage in meaningful ways through voting, chatting, and sharing
              questions. Our goal is to foster a sense of community and encourage active participation among
              our youth members.
            </p>
          </section>

          <section className="glass rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaBullhorn className="text-xl sm:text-2xl text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Features</h2>
            </div>
            <ul className="list-none space-y-3 text-base sm:text-lg">
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">•</span>
                <div>
                  <strong className="text-gray-800">MyVote:</strong> Participate in voting on various categories and topics
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">•</span>
                <div>
                  <strong className="text-gray-800">Chatroom:</strong> Real-time chat with other members and ask questions (login required)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">•</span>
                <div>
                  <strong className="text-gray-800">Community:</strong> Connect with fellow believers and build lasting friendships
                </div>
              </li>
            </ul>
          </section>

          <section className="glass rounded-xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Our Mission</h2>
            <p className="text-base sm:text-lg leading-relaxed">
              Our mission is to create a welcoming and engaging environment where young people can grow
              spiritually, connect with one another, and actively participate in our church community.
              We believe in the power of technology to strengthen our bonds and facilitate meaningful
              interactions.
            </p>
          </section>

          <section className="glass bg-indigo-50/50 rounded-xl p-4 sm:p-6 border border-indigo-200">
            <div className="flex items-center gap-3 mb-3">
              <FaEnvelope className="text-xl sm:text-2xl text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-indigo-800">Contact Us</h2>
            </div>
            <p className="text-base sm:text-lg">
              If you have any questions or need assistance, please don't hesitate to reach out to our
              church administration or use the chatroom to connect with other members.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
