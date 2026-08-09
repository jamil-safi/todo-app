# TaskHub — Todo App

A full-stack todo/task management application with JWT cookie-based authentication, built with React (Vite) on the frontend and Django REST Framework on the backend, fully containerized with Docker and deployed to AWS EC2 via a GitHub Actions CI/CD pipeline.

## Tech Stack

**Frontend**
- React + Vite
- React Router
- Nginx (production serving)

**Backend**
- Django 6 + Django REST Framework
- PostgreSQL
- JWT authentication via `djangorestframework-simplejwt`, stored in `HttpOnly` cookies
- `drf-spectacular` for OpenAPI schema / Swagger docs
- `gunicorn` (production WSGI server)
- `whitenoise` (static file serving)

**Infrastructure**
- Docker + Docker Compose
- AWS EC2 (Ubuntu)
- GitHub Actions (CI/CD)
- Docker Hub (image registry)

## Project Structure

```
todo-app/
├── .github/workflows/
│   └── main.yml              # CI/CD pipeline: test → build → push → deploy
├── backend/
│   ├── core/                   # auth, users, JWT middleware
│   ├── todos/                  # lists & tasks app
│   ├── todoapp/                # project settings, urls
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env                    # local secrets (gitignored)
│   ├── requirements.txt
│   ├── conftest.py
│   └── pytest.ini
├── frontend/
│   ├── src/
│   ├── Dockerfile.dev          # Vite dev server
│   ├── Dockerfile.prod         # multi-stage build → Nginx
│   ├── nginx.conf
│   ├── .env.development
│   └── .env.production
├── docker-compose.dev.yml      # local development (hot reload)
├── docker-compose.prod.yml     # production (pre-built images from Docker Hub)
└── README.md
```

## API Routes

All backend API routes are namespaced under `/api/`:

| Route | Description |
|---|---|
| `/api/auth/` | Signup, login, logout, profile, password reset |
| `/api/todos/` | Lists and tasks CRUD |
| `/api/schema/`, `/api/docs/`, `/api/redoc/` | OpenAPI schema & interactive docs |
| `/admin/` | Django admin panel |

## How to run this project on your device

**1. Using Docker images**
* Create the file structure:
```
todo-app/
├── backend/
│   ├── .env 
├── docker-compose.prod.yml (download from the git repo)
```
*  Paste the environment variables to the `.env` file
```bash
SECRET_KEY=your-secret-key
DEBUG=False
COOKIE_SECURE=False
ALLOWED_HOSTS=localhost,127.0.0.1,backend
POSTGRES_DB=todoapp_db
POSTGRES_USER=todoapp_user
POSTGRES_PASSWORD=todoapp-db-password
DATABASE_URL=postgres://todoapp_user:todoapp-db-password@db:5432/todoapp_db
FRONTEND_URL=http://localhost
CORS_ALLOWED_ORIGINS=http://localhost
```
* Now run these commands from powershell or command prompt
```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
* The website is ready to explore via `http://localhost`


**2. Using Git clone and manual setup**


* Create a new folder, open the folder in vscode terminal or powershell and clone this git repository

```bash
git clone https://github.com/jamil-safi/todo-app.git
```

* create a `.env` file in the `backend` folder and paste the environment variabls
```bash
SECRET_KEY=your-secret-key
DEBUG=True
COOKIE_SECURE=False
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
``` 

* Open the `backend` folder in a new terminal and paste these codes
```bash
# Backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend runs on the url: `http://localhost:8000`

* Open the `frontend` folder in a new terminal and paste these codes
```bash
# Frontend, in a separate terminal
npm install
npm run dev
```

Frontend runs on the url: `http://localhost:5173`

## Environment Variables

Set in `backend/.env` (never committed — see `.env.example` for the template):

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django's cryptographic signing key |
| `DEBUG` | `False` in production |
| `COOKIE_SECURE` | `False` until HTTPS is set up; `True` once it is — controls whether auth cookies require HTTPS |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames/IPs |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Read directly by the Postgres container |
| `DATABASE_URL` | Full connection string Django uses via `dj-database-url` |
| `FRONTEND_URL` | Used in password reset email links |
| `CORS_ALLOWED_ORIGINS` | Allowed cross-origin request sources |

## CI/CD Pipeline

Defined in `.github/workflows/deploy.yml`, triggered on every push to `main`:

1. **Test** — spins up a temporary Postgres instance, runs the full `pytest` suite. Pipeline stops here if any test fails.
2. **Build & Push** — builds both Docker images, tags them with the commit SHA (plus `latest`), pushes to Docker Hub.
3. **Deploy** — copies `docker-compose.prod.yml` to the EC2 instance, updates the image tags to the new commit SHA, pulls, and recreates containers.

**Required GitHub Secrets:**

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (Read & Write scope) |
| `EC2_HOST` | EC2 instance public IP or domain |
| `EC2_SSH_KEY` | Full private key content for SSH access |

Note: `backend/.env` lives only on the EC2 instance and is never touched by the pipeline — real secrets never pass through GitHub.

## Notes on HTTPS

The app currently runs over plain HTTP on a raw EC2 IP address. Since Let's Encrypt cannot issue certificates for IP addresses, HTTPS requires a registered domain name pointed at the instance. Until that's set up, `COOKIE_SECURE=False` is required for login to function — browsers refuse to store `Secure`-flagged cookies over an insecure connection.
