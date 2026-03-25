# AI-Powered Tech Learning Platform

A personalized learning platform where users get customized tech learning recommendations based on their goals, skill level, and learning style. The system captures user intent via a conversational quiz, matches them to a learning persona, and provides AI-generated study recommendations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker & Docker Compose (optional)

### Local Development

#### 1. Clone and Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

#### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example backend/.env
```

**Required in `backend/.env`:**
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `FIRESTORE_SERVICE_ACCOUNT_JSON` - Firebase service account JSON

#### 3. Run the Development Servers

**Backend:**
```bash
cd backend
uvicorn main:app --reload
```
Server runs at: http://localhost:8000

**Frontend:**
```bash
cd frontend
npm run dev
```
App runs at: http://localhost:5173

#### 4. Using Docker Compose

```bash
docker-compose up --build
```

This will start both frontend and backend services.

## 🏗️ Architecture

### 4-Layer Architecture

1. **Smart Preference Capture** - React frontend with 3-step quiz
2. **AI Learning Engine** - FastAPI backend with Gemini NLP + persona matching
3. **Personalized Learning Path** - Dynamic UI with AI-generated recommendations
4. **Real-time Analytics** - WebSocket analytics + rescue prompts

### Tech Stack

- **Frontend:** React (Vite), Framer Motion, TailwindCSS
- **Backend:** FastAPI, scikit-learn, Google Gemini API
- **Database:** Firestore
- **Deployment:** Vercel (frontend), Railway (backend)

## 📡 API Endpoints

### POST /api/v1/onboard
Submit user preferences and get personalized learning recommendations.

**Request:**
```json
{
  "uid": "user_123",
  "goal": "build",
  "skill_level": 3,
  "success_text": "I want to build a web app",
  "device_type": "desktop"
}
```

**Response:**
```json
{
  "session_config": {
    "persona": "steady-builder",
    "highlight_features": ["documentation", "examples"],
    "content_tone": "friendly",
    "first_task": "build_first_project",
    "skip_modules": [],
    "learning_recommendations": [
      {"type": "video", "title": "Getting Started", "platform": "YouTube", "link": "#", "why": "Perfect intro"},
      {"type": "notes", "title": "Documentation", "platform": "Docs", "link": "#", "why": "Comprehensive"},
      {"type": "quiz", "title": "Practice Quiz", "platform": "LeetCode", "link": "#", "why": "Test knowledge"}
    ]
  },
  "user_id": "user_123",
  "session_id": "session_abc"
}
```

### POST /api/v1/analytics/drop-off
Track user drop-off events.

### GET /api/v1/analytics/summary
Get analytics summary.

### WebSocket /ws/session/{session_id}
Real-time event streaming for analytics. Connect using:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session/{session_id}')
```

## 🎯 Learning Persona System

The platform uses 5 learning personas:
- **Slow Explorer** - Step-by-step learners
- **Fast Beginner** - Quick starters who want fast results
- **Steady Builder** - Consistent learners building projects
- **Expert Builder** - Experienced developers wanting advanced content
- **Expert Explorer** - Technical users exploring new technologies

Each persona receives personalized AI-generated learning recommendations including videos, notes, quizzes, and flashcards.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GCP_PROJECT_ID` | Google Cloud project ID | For Firestore |
| `FIRESTORE_SERVICE_ACCOUNT_JSON` | Firebase service account | For Firestore |
| `VITE_API_URL` | Backend API URL (frontend) | No |
| `VITE_WS_URL` | WebSocket URL (frontend) | No |

## 📝 License

MIT
