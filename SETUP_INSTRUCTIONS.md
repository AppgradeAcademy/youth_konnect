# Setup Instructions - Youth Connect

## Quick Start

The app has been migrated to:
- **Backend**: Python FastAPI (runs on port 8000)
- **Frontend**: React + Vite (needs to be created, will run on port 5173)

## Option 1: Keep Using Next.js (Current Setup)

To run the existing Next.js app:

```bash
npm install
npm run dev:3002
```

App runs on http://localhost:3002

## Option 2: Use Python Backend + React Frontend (New Setup)

### Backend Setup:

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Create .env file with:
# DATABASE_URL=postgresql://rzeszow_youth_user:gVIAC8suj2kw14bObW3Ws2rUFRTrtojn@dpg-d5dq5gali9vc73dn9rb0-a.frankfurt-postgres.render.com/rzeszow_youth

uvicorn main:app --reload --port 8000
```

Backend runs on http://localhost:8000

### Frontend Setup:

The React frontend still needs to be created. Would you like me to:
1. Create it now (full migration)?
2. Continue using Next.js for now?

## Current Status

✅ Python backend created and ready
⏳ React frontend needs to be created
✅ Next.js frontend still works (can use for now)

