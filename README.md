# AI Interview Analyzer

A full-stack interview-practice application for creating mock interview sessions, answering role-based questions, and reviewing structured, AI-generated coaching feedback. It runs locally with SQLite and deterministic Demo AI by default; no paid AI service or external database is required for the standard workflow.

> **Assessment notice:** Scores and feedback are AI-generated practice suggestions based on submitted answer text. They may be incomplete or inaccurate and are not hiring decisions or psychological assessments.

## Features

- Register, log in, and log out with hashed passwords and JWT authentication.
- Create interviews for a custom job role, experience level, type, difficulty, and 5–20 questions.
- Generate role-aware interview questions and analyze submitted answers through a separate AI service.
- Run the complete workflow in deterministic Demo AI mode without an API key.
- Receive answer-level scores, strengths, improvement areas, suggested answers, missing topics, and practical tips.
- Review overall results, category averages, interview history, and performance trends.
- Update profile preferences; search, filter, and delete past sessions.
- Responsive landing page, dashboard, interview session, and result pages.
- Optional browser speech-to-text when supported; text answers remain available everywhere.
- SQLite by default, SQLAlchemy persistence, FastAPI Swagger documentation, and Docker Compose support.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React 18, Vite, JavaScript, React Router, Axios, Recharts, Lucide |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic, SQLAlchemy |
| Authentication | Argon2 password hashing, JWT bearer tokens |
| Database | SQLite by default; SQLAlchemy supports configuring PostgreSQL |
| AI | Separate service abstraction; Demo AI by default, OpenAI-compatible chat completions in API mode |

## Architecture

```text
Browser (React pages and services)
        │ VITE_API_URL / JSON / bearer token
        ▼
FastAPI routers ── Auth / Profile / Interviews / Analysis
        │                         │
        ▼                         ▼
SQLAlchemy models             AI service abstraction
        │                         ├── deterministic Demo AI
        ▼                         └── configurable API provider
 SQLite database
```

The backend validates requests and AI responses with Pydantic. The frontend gets its API base URL from `VITE_API_URL`; protected endpoints use a bearer token held for the browser session. CORS is restricted to the configured frontend origin.

## Folder structure

```text
ai_inrerview_analyzer/
├── README.md
├── package.json          # one-command dev runner (npm run dev)
├── .gitignore
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── main.py
│   │   ├── core/          # settings, JWT/password security, dependencies
│   │   ├── database/      # SQLAlchemy engine and models
│   │   ├── routers/       # authentication, interviews, analysis, profile
│   │   ├── schemas/       # validated request and response models
│   │   └── services/      # AI service abstraction
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── components/    # common UI and layout
│       ├── context/       # auth state
│       ├── pages/         # public and protected screens
│       ├── services/      # API, auth, interview, voice helpers
│       └── styles/        # tokens and responsive styles
└── tests/                 # reserved for additional end-to-end tests
```

## Requirements

- Python 3.11 or newer (Python 3.12 recommended)
- Node.js 20 or newer and npm
- Optional: Docker Desktop for Compose

## Installation

### Quick start: run both apps with one command

First-time setup: install the backend dependencies and frontend/root npm dependencies once:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
pip install -r requirements.txt
cd ..
Copy-Item frontend/.env.example frontend/.env
npm install
npm --prefix frontend install
```

Then, from the project root, start both servers together:

```powershell
npm run dev
```

The frontend runs at <http://localhost:5173> and the backend/API docs at <http://localhost:8000> / <http://localhost:8000/docs>. Press `Ctrl+C` to stop both. Keep `npm run dev` running in that terminal. Stop any separately running dev servers first so ports 5173 and 8000 are available.

If your virtual environment uses a Python installation not available as `python` in the terminal, activate `backend/.venv` before the command, or set up Python on your PATH. The frontend/backend can also be started independently using the instructions below.

Open two terminals from the project root.

### Backend setup (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If PowerShell blocks environment activation, use `\.venv\Scripts\python.exe -m pip install -r requirements.txt` and `\.venv\Scripts\python.exe -m uvicorn app.main:app --reload` instead. On macOS/Linux, activate with `source .venv/bin/activate`.

The API is at <http://localhost:8000> and interactive Swagger docs are at <http://localhost:8000/docs>. SQLite is created automatically in the backend directory at startup.

### Frontend setup

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>. Register an account to start; no pre-seeded user or default password exists.

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `APP_NAME` | `AI Interview Analyzer` | API title |
| `DATABASE_URL` | `sqlite:///./interview_analyzer.db` | SQLAlchemy database URL |
| `SECRET_KEY` | Development fallback | JWT signing key; replace outside local demos |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT lifetime |
| `AI_MODE` | `mock` | `mock` or `api` |
| `AI_API_KEY` | Empty | Provider key in API mode |
| `AI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible API base URL |
| `AI_MODEL` | `gpt-4o-mini` | Model name for API mode |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |

### Frontend (`frontend/.env`)

| Variable | Default example | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | FastAPI base URL used by Axios |

Do not commit `.env` files. `.gitignore` excludes local environment secrets and generated database files.

## Demo AI mode

Demo AI is the default (`AI_MODE=mock`). It creates reproducible role/type-aware questions and rule-based sample feedback without an API key. Demo scores are illustrative, not objective measurements. To try the complete workflow:

1. Start backend and frontend using the steps above.
2. Register or log in.
3. Create a session, submit answers, finish, and review results and detailed feedback.

Browser speech recognition is optional and browser-dependent. If unavailable or microphone permission is denied, use the answer text box.

## Configuring an AI provider

Set `AI_MODE=api`, provide `AI_API_KEY`, and configure `AI_BASE_URL` / `AI_MODEL` in `backend/.env`. The service expects an OpenAI-compatible `/chat/completions` endpoint supporting JSON response format. AI output is validated before use. Provider failures or invalid responses fall back to Demo AI so practice remains usable. Never put the API key in frontend variables.

## API documentation

FastAPI Swagger UI is available at `/docs`; OpenAPI JSON is at `/openapi.json`.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Obtain JWT |
| `GET` | `/api/auth/me` | Current user |
| `POST` | `/api/interviews` | Create session and questions |
| `GET` | `/api/interviews` | List current user's sessions |
| `GET` | `/api/interviews/{id}` | Get session and questions |
| `POST` | `/api/interviews/{id}/start` | Start/resume session |
| `POST` | `/api/interviews/{id}/answers` | Submit/update answer and analyze it |
| `POST` | `/api/interviews/{id}/finish` | Finish and calculate session score |
| `DELETE` | `/api/interviews/{id}` | Delete an owned session |
| `GET` | `/api/interviews/{id}/analysis` | Get answer feedback for a session |
| `GET` | `/api/answers/{id}/analysis` | Get one answer's analysis |
| `GET` / `PUT` | `/api/profile` | Read/update profile preferences |

Authenticated endpoints require `Authorization: Bearer <access_token>`. API errors do not return internal exception details.

## Database and PostgreSQL

SQLite initializes automatically and is recommended for local development. To use PostgreSQL, install a PostgreSQL SQLAlchemy driver (for example, `psycopg[binary]`) and configure a PostgreSQL `DATABASE_URL`; the ORM is already database-URL driven. Add a migration tool such as Alembic before evolving a deployed schema.

## Docker Compose

Docker Compose starts the backend and frontend with Demo AI:

```powershell
docker compose up --build
```

The app is available on ports 5173 and 8000. Compose uses a local development signing key by default; set a secure `SECRET_KEY` environment variable for any shared/deployed environment. Docker is optional.

## Testing and quality checks

Backend tests:

```powershell
cd backend
pytest
```

Frontend production build:

```powershell
cd frontend
npm run build
```

Manual end-to-end path: register → create an interview → answer questions → finish → review results and detailed feedback → check history/profile → delete a session. Also check invalid login, empty answers, unauthenticated access, and mobile layout.

## Troubleshooting

- **Frontend cannot reach API:** ensure backend is running on port 8000 and `frontend/.env` has the correct `VITE_API_URL`; restart Vite after changing environment values.
- **CORS error:** set `FRONTEND_URL` to the exact origin including scheme and port, then restart the backend.
- **401 / expired login:** sign in again; JWTs live in session storage and expire based on `ACCESS_TOKEN_EXPIRE_MINUTES`.
- **Demo questions/analysis:** confirm `AI_MODE=mock` in `backend/.env` and restart Uvicorn.
- **AI API issue:** check backend key/model/base URL; API failures fall back to mock evaluation.
- **Reset local database:** stop Uvicorn, back up needed data, then remove `backend/interview_analyzer.db`; it is recreated at startup.
- **Windows activation issue:** use the virtual-environment Python executable directly as described under Backend setup.

## Security and privacy notes

Passwords are stored as Argon2 hashes, not plaintext. SQLAlchemy parameterizes database operations. JWTs are stored in `sessionStorage` for the active browser session. Use a strong key and HTTPS in deployments, configure a production database and migrations, and avoid submitting confidential information. This is a local-development starter, not a security-audited production service.

## Future improvements

- Add Alembic migrations and PostgreSQL integration tests.
- Expand automated API, UI, and browser end-to-end coverage.
- Add provider-specific adapters, rate limits, retries, and usage controls.
- Support more languages and configurable speech recognition.
- Add additional score analytics and exportable reports.
- Add deployment hardening, observability, and account recovery flows.
