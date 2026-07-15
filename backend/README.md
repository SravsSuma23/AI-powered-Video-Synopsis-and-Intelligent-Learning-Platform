# Video Synopsis AI - Backend Architecture

The backend phase of the **Video Synopsis AI** application is fully completed. This document provides step-by-step instructions for running the server, connecting it to your React frontend, and testing the REST APIs.

## 📁 Architecture Overview
This is a production-ready, enterprise-level modular backend architecture:
*   `app/core/` - Configuration logic and Environment settings
*   `app/database/` - MongoDB Atlas connection and motor client definitions
*   `app/models/` - Internal Database models mapping to MongoDB BSON schemas
*   `app/schemas/` - Pydantic models for request/response serialization/validation
*   `app/utils/` - JWT security, password hashing, and dependency injection
*   `app/services/` - Business logic controllers performing database CRUD operations
*   `app/routes/` - FastAPI endpoints (Auth, Synopsis, Admin)

---

## 🚀 1. How to Run the Backend Locally

**Prerequisites:** You must have Python 3.9+ installed on your system.

### Step 1: Open Terminal in Backend Folder
Open your terminal and navigate strictly to the backend folder:
```bash
cd "e:\Symboisys technoligies internship\backend"
```

### Step 2: Create a Virtual Environment (Recommended)
```bash
python -m venv venv
# Activate on Windows:
venv\Scripts\activate
# Activate on Mac/Linux:
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure MongoDB Database
The `.env` file uses a placeholder string for MongoDB Atlas.
1. Open `.env`
2. Replace `MONGODB_URL=mongodb+srv://admin:symbiosys2026@cluster0.mongodb.net/?retryWrites=true&w=majority` with your actual live MongoDB Atlas Connection String.
3. Keep the `PORT=5000` because the React frontend currently expects it.

### Step 5: Start the Server
```bash
python -m app.main
# OR alternatively:
uvicorn app.main:app --reload --port 5000
```
*You should see output similar to:*
`INFO: Application startup complete.`
`INFO: Successfully pinged MongoDB Atlas. Connection established.`

---

## 🔗 2. How the Frontend Connects to the Backend

In your React frontend code (`frontend/src/services/api.ts`):
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```
When you launch the FastAPI server on port 5000, the React frontend will immediately route its HTTP requests (via Axios) to the backend.

### To switch from Mock data to Real DB in Frontend:
The `authService.ts` and `synopsisService.ts` files currently have an `IS_DEMO_MODE = true;` flag at the top.
1. Open `frontend/src/services/authService.ts` and change it to `false`.
2. Open `frontend/src/services/synopsisService.ts` and change it to `false`.
3. The frontend will now dynamically use the `POST /api/auth/login` and `POST /api/synopsis/generate` routes we just created!

---

## 🧪 3. How to Test APIs in Swagger

FastAPI auto-generates interactive API documentation. You don't even need Postman!

1. **Access Swagger UI:** With the server running, open a browser and go to:
   [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs)
2. **Register a User:**
   - Scroll to `POST /api/auth/register`.
   - Click "Try it out".
   - Put in a test payload like `{"name": "Test", "email": "test@demo.com", "password": "password123", "role": "User"}`
   - Click "Execute". You will get a `201 Created` with a Token.
3. **Authorize the Swagger UI:**
   - Scroll to the very top right and click the green **"Authorize"** button.
   - Paste the JWT Token you just received (or use the `POST /api/auth/login` route to get one).
   - Now, you can safely trigger protected routes like `GET /api/synopsis/history` or `POST /api/synopsis/generate`.

---

## 📡 4. Verifying MongoDB Connection

You can verify the connection is successful in two distinct ways:
1. **Health Check API:** Go to `http://127.0.0.1:5000/api/health` in your browser. You should see `"database": "connected"`.
2. **MongoDB Atlas UI:** Log in to your MongoDB Atlas dashboard, click "Browse Collections", and observe that a `video_synopsis_ai` database was automatically created containing `users` and `synopses` documents after your first API calls.

---

## 🔮 5. Future Scalability (AI Phase)
Because we built this modularly, adding OpenAI and Whisper in the future is easy:
1. Provide valid keys in `.env` (`OPENAI_API_KEY`, etc.).
2. In `app/services/synopsis_service.py`, instead of returning the mock schema, you will fetch the YouTube transcript, pass the text to OpenAI using the standard `openai` python library, map the OpenAI response into the Pydantic schema, and save it to MongoDB identically!
