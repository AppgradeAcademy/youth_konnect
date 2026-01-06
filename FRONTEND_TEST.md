# Frontend Testing Guide

## Testing Frontend Pages with curl/PowerShell

Your Youth Connect frontend is running on **http://localhost:3002**

### PowerShell Commands

```powershell
# Test Home Page
Invoke-WebRequest -Uri http://localhost:3002 -UseBasicParsing

# Test About Page
Invoke-WebRequest -Uri http://localhost:3002/about -UseBasicParsing

# Test Login Page
Invoke-WebRequest -Uri http://localhost:3002/login -UseBasicParsing

# Test Register Page
Invoke-WebRequest -Uri http://localhost:3002/register -UseBasicParsing

# Test MyVote Page
Invoke-WebRequest -Uri http://localhost:3002/myvote -UseBasicParsing

# Test Chatroom Page
Invoke-WebRequest -Uri http://localhost:3002/chatroom -UseBasicParsing
```

### Get Page Content

```powershell
# Get HTML content from home page
$response = Invoke-WebRequest -Uri http://localhost:3002 -UseBasicParsing
$response.Content

# Get just the status code
(Invoke-WebRequest -Uri http://localhost:3002 -UseBasicParsing).StatusCode
```

### Using curl (if available)

```bash
# Test Home Page
curl http://localhost:3002

# Test About Page
curl http://localhost:3002/about

# Test Login Page
curl http://localhost:3002/login

# Test Register Page
curl http://localhost:3002/register

# Test MyVote Page
curl http://localhost:3002/myvote

# Test Chatroom Page
curl http://localhost:3002/chatroom
```

## Available Frontend Pages

| Page | URL | Status |
|------|-----|--------|
| Home | http://localhost:3002 | ✅ |
| About | http://localhost:3002/about | ✅ |
| Login | http://localhost:3002/login | ✅ |
| Register | http://localhost:3002/register | ✅ |
| MyVote | http://localhost:3002/myvote | ✅ |
| Chatroom | http://localhost:3002/chatroom | ✅ |

## Quick Test Script

Run this PowerShell script to test all pages at once:

```powershell
$pages = @("/", "/about", "/login", "/register", "/myvote", "/chatroom")
$baseUrl = "http://localhost:3002"

foreach ($page in $pages) {
    $url = $baseUrl + $page
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        Write-Host "✅ $url - Status: $($response.StatusCode)"
    } catch {
        Write-Host "❌ $url - Error: $_"
    }
}
```

## Expected Response

All pages should return:
- **Status Code**: 200 OK
- **Content-Type**: text/html
- **Title**: "Youth Connect - AFM Rzeszow" (for home page)




