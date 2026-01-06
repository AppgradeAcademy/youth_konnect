# curl Examples for Youth Connect API

## Using PowerShell (Windows)

In PowerShell, `curl` is an alias for `Invoke-WebRequest`. Use `Invoke-RestMethod` for JSON APIs.

### GET Requests

```powershell
# Get all categories
Invoke-RestMethod -Uri http://localhost:3000/api/categories -Method GET

# Get all messages
Invoke-RestMethod -Uri http://localhost:3000/api/messages -Method GET

# Get all questions
Invoke-RestMethod -Uri http://localhost:3000/api/questions -Method GET

# Get user votes (replace USER_ID with actual user ID)
Invoke-RestMethod -Uri "http://localhost:3000/api/votes?userId=USER_ID" -Method GET
```

### POST Requests

```powershell
# Register a new user
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

# Create a category (admin only)
$categoryBody = @{
    name = "Youth Events"
    description = "Vote for upcoming youth events"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/categories -Method POST -Body $categoryBody -ContentType "application/json"

# Create a vote (replace USER_ID and CATEGORY_ID)
$voteBody = @{
    userId = "USER_ID"
    categoryId = "CATEGORY_ID"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/votes -Method POST -Body $voteBody -ContentType "application/json"

# Send a chat message (replace USER_ID)
$messageBody = @{
    userId = "USER_ID"
    content = "Hello everyone!"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/messages -Method POST -Body $messageBody -ContentType "application/json"

# Post a question (replace USER_ID)
$questionBody = @{
    userId = "USER_ID"
    title = "What time is the service?"
    content = "I would like to know the service times"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/questions -Method POST -Body $questionBody -ContentType "application/json"
```

## Using curl (Linux/Mac/Git Bash)

If you have actual `curl` installed (not PowerShell alias):

```bash
# Get all categories
curl http://localhost:3000/api/categories

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Create category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Youth Events","description":"Vote for events"}'

# Create vote
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","categoryId":"CATEGORY_ID"}'

# Send message
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","content":"Hello!"}'

# Post question
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","title":"Question","content":"Question content"}'
```

## Test Results

✅ All endpoints are working!
- GET endpoints return empty arrays (database is empty)
- POST endpoints successfully create data
- Database connection to Render PostgreSQL is active

## Quick Test

Run this to verify everything is working:

```powershell
# Test all GET endpoints
Write-Host "Testing Categories:"; Invoke-RestMethod -Uri http://localhost:3000/api/categories
Write-Host "`nTesting Messages:"; Invoke-RestMethod -Uri http://localhost:3000/api/messages
Write-Host "`nTesting Questions:"; Invoke-RestMethod -Uri http://localhost:3000/api/questions
```


