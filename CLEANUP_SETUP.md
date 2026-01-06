# Question Cleanup Setup

This document explains how to set up automatic cleanup of questions older than 30 days.

## Automatic Cleanup Options

### Option 1: Manual Script (Development/Testing)

Run the cleanup script manually:

```bash
npm run cleanup:questions
```

This will delete all questions older than 30 days from the database.

### Option 2: API Endpoint (Recommended for Production)

Use the cleanup API endpoint:

**Cleanup Endpoint:**
- `POST /api/cleanup/questions` - Deletes questions older than 30 days
- `GET /api/cleanup/questions` - Checks how many questions would be deleted (for testing)

**Cron Endpoint:**
- `POST /api/cron/cleanup-questions` - Designed to be called by external cron services
- `GET /api/cron/cleanup-questions` - Same as POST (for easy testing)

### Option 3: External Cron Service

Set up an external cron service to call the cleanup endpoint daily:

1. **Vercel Cron** (if deploying on Vercel):
   Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/cleanup-questions",
       "schedule": "0 0 * * *"
     }]
   }
   ```

2. **EasyCron** or similar service:
   - Create a cron job
   - URL: `https://your-domain.com/api/cron/cleanup-questions`
   - Method: POST
   - Schedule: Daily at midnight (0 0 * * *)

3. **GitHub Actions** (if using GitHub):
   Create `.github/workflows/cleanup.yml`:
   ```yaml
   name: Cleanup Old Questions
   on:
     schedule:
       - cron: '0 0 * * *'  # Daily at midnight
   jobs:
     cleanup:
       runs-on: ubuntu-latest
       steps:
         - name: Call cleanup API
           run: |
             curl -X POST https://your-domain.com/api/cron/cleanup-questions
   ```

## How It Works

- Questions are stored with a `createdAt` timestamp
- The cleanup function calculates the date 30 days ago
- All questions with `createdAt` older than 30 days are deleted
- The cleanup is safe and only deletes questions (not users or other data)

## Security (Optional)

To secure the cron endpoint, uncomment the authorization check in `app/api/cron/cleanup-questions/route.ts` and set an environment variable:

```env
CRON_SECRET=your-secret-key-here
```

Then configure your cron service to send the authorization header:
```
Authorization: Bearer your-secret-key-here
```

## Testing

1. Test the cleanup endpoint:
   ```bash
   curl -X GET http://localhost:3002/api/cleanup/questions
   ```
   This shows how many questions would be deleted without actually deleting them.

2. Run cleanup manually:
   ```bash
   curl -X POST http://localhost:3002/api/cleanup/questions
   ```

3. Or use the script:
   ```bash
   npm run cleanup:questions
   ```


