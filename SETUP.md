# Setup Instructions

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   # The .env file is already configured with the PostgreSQL database
   npx prisma generate
   npx prisma db push
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Creating an Admin User

There are two ways to create an admin user:

### Method 1: Using Prisma Studio (Recommended)

1. Run Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Open the User table
3. Create a new user or edit an existing user
4. Set the `role` field to `"admin"` (make sure to use quotes)

### Method 2: Using the Script

1. Run the admin creation script:
   ```bash
   node scripts/create-admin.js
   ```

2. Follow the prompts to enter email, name, and password

### Method 3: Manual Registration + Database Update

1. Register a user normally through the registration page
2. Use Prisma Studio or a database tool to change the user's `role` field from `"user"` to `"admin"`

## Default Features

- **Regular Users**: Can vote, chat, and ask questions
- **Admin Users**: Can do everything regular users can do, plus:
  - Add new voting categories
  - Manage platform content

## Troubleshooting

### Database Issues
If you encounter database errors:
1. Check that the DATABASE_URL in `.env` is correct
2. Verify the database connection is working
3. Run `npx prisma db push` again
4. Restart the development server

### Port Already in Use
If port 3000 is already in use:
- Kill the process using port 3000, or
- Set a different port: `PORT=3001 npm run dev`

