# API Testing Guide

Your Youth Connect platform is running! Here are curl examples to test the API endpoints:

## Base URL
All endpoints are available at: `http://localhost:3000`

## Testing Endpoints

### 1. Get All Categories
```bash
curl http://localhost:3000/api/categories
```

### 2. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

### 4. Get All Messages
```bash
curl http://localhost:3000/api/messages
```

### 5. Get All Questions
```bash
curl http://localhost:3000/api/questions
```

### 6. Get User Votes (requires userId parameter)
```bash
curl "http://localhost:3000/api/votes?userId=YOUR_USER_ID"
```

### 7. Create a Category (Admin only - requires authentication in production)
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Youth Events\",\"description\":\"Vote for upcoming youth events\"}"
```

### 8. Create a Vote (requires userId and categoryId)
```bash
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"YOUR_USER_ID\",\"categoryId\":\"CATEGORY_ID\"}"
```

### 9. Create a Chat Message (requires userId)
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"YOUR_USER_ID\",\"content\":\"Hello everyone!\"}"
```

### 10. Create a Question (requires userId)
```bash
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"YOUR_USER_ID\",\"title\":\"Question Title\",\"content\":\"Question content here\"}"
```

## PowerShell Alternative

If you're using PowerShell, you can use `Invoke-RestMethod`:

```powershell
# Get categories
Invoke-RestMethod -Uri http://localhost:3000/api/categories -Method GET

# Register user
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/auth/register -Method POST -Body $body -ContentType "application/json"

# Login
$loginBody = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body $loginBody -ContentType "application/json"
```

## Web Interface

You can also access the platform through your web browser:

- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **MyVote**: http://localhost:3000/myvote
- **Chatroom**: http://localhost:3000/chatroom
- **About Us**: http://localhost:3000/about

