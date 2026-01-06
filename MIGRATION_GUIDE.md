# Migration Guide: Next.js to Python + React

This project has been migrated from Next.js (full-stack) to a Python backend (FastAPI) + React frontend (Vite) architecture.

## Project Structure

```
├── backend/          # Python FastAPI backend
│   ├── main.py      # FastAPI app and routes
│   ├── models.py    # SQLAlchemy database models
│   ├── schemas.py   # Pydantic schemas
│   ├── database.py  # Database configuration
│   ├── auth.py      # Authentication utilities
│   └── requirements.txt
│
└── frontend/        # React + Vite frontend (to be created)
    ├── src/
    ├── public/
    └── package.json
```

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```
DATABASE_URL=postgresql://rzeszow_youth_user:gVIAC8suj2kw14bObW3Ws2rUFRTrtojn@dpg-d5dq5gali9vc73dn9rb0-a.frankfurt-postgres.render.com/rzeszow_youth
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

5. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

API will be available at http://localhost:8000
API docs at http://localhost:8000/docs

## Next Steps

The React frontend still needs to be created. The backend API endpoints match the original Next.js API routes, so the frontend can use the same API structure.

## API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/categories` - Get categories (query param `?all=true` for all categories)
- `POST /api/categories` - Create category
- `PATCH /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
- `GET /api/votes` - Get votes (query params: `userId` or `email`)
- `POST /api/votes` - Create vote
- `DELETE /api/votes/{categoryId}` - Delete vote (query params: `userId` or `email`)
- `GET /api/messages` - Get chat messages
- `POST /api/messages` - Create message
- `GET /api/questions` - Get questions
- `POST /api/questions` - Create question




