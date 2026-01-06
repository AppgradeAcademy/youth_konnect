# Youth Connect Backend

Python FastAPI backend for Youth Connect platform.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with:
```
DATABASE_URL=postgresql://rzeszow_youth_user:gVIAC8suj2kw14bObW3Ws2rUFRTrtojn@dpg-d5dq5gali9vc73dn9rb0-a.frankfurt-postgres.render.com/rzeszow_youth
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

3. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000

API documentation available at http://localhost:8000/docs


