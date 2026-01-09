# Verse

**Verse** is a social platform for church youth communities, designed to bring members together through group chatrooms, posts, polls, and meaningful connections.

## Features

- 🏢 **Organizations & Groups**: Organizations (like "AFM Rzeszow") can create groups (like "Youth Connect") with their own chatrooms
- 💬 **Group Chatrooms**: MXit-style group-based chatrooms where members can communicate
- 📱 **Social Feed**: Instagram-style feed with posts, images, and comments
- 🗳️ **Polls**: Voting system for various categories
- 👥 **Follow System**: Follow organizations and other users
- 🔔 **Notifications**: Real-time notifications for new posts and activities

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT-based authentication

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Fill in your DATABASE_URL
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Set up initial data (creates AFM Rzeszow organization and Youth Connect group):
```bash
node scripts/setup-initial-data.js
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - Reusable React components
- `/prisma` - Database schema and migrations
- `/scripts` - Utility scripts for setup and maintenance
- `/public` - Static assets

## License

© 2024 Verse - AFM Rzeszow
