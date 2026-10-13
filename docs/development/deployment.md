# Deployment Guide

This guide covers deploying Knik applications for production use.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Web App Deployment](#web-app-deployment)
- [Electron Desktop App](#electron-desktop-app)
- [Console](#console)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Required Environment Variables

```bash
# AI Provider Configuration (7 providers available)
export KNIK_AI_PROVIDER="vertex"  # vertex, gemini, zhipuai, zai, zai_coding, custom, mock
export KNIK_AI_MODEL="gemini-2.0-flash-exp"

# Provider-specific credentials
export GOOGLE_CLOUD_PROJECT="your-project-id"  # vertex provider
# or: export GEMINI_API_KEY="your-key"         # gemini provider
# or: export ZHIPUAI_API_KEY="your-key"        # zhipuai provider
# or: export ZAI_API_KEY="your-key"            # zai provider (zai_coding: ZAI_CODING_API_KEY)
# or: export KNIK_CUSTOM_API_BASE="http://..."  # custom provider (any OpenAI-compatible API)

# Voice Configuration (9 voices available)
export KNIK_VOICE="af_heart"
# Female: af_heart, af_bella, af_sarah, af_nicole, af_sky
# Male: am_adam, am_michael, am_leo, am_ryan

# Web App Configuration
export KNIK_WEB_HOST="0.0.0.0"
export KNIK_WEB_PORT="8010"
export KNIK_WEB_RELOAD="false"
export KNIK_WEB_CORS_ORIGINS="https://yourdomain.com"
export KNIK_WEB_REQUIRE_API_KEY="true"   # once the first key exists (see API keys in environment-variables.md)

# Database (conversations, settings, API keys, workflows)
export KNIK_DB_HOST="localhost"
export KNIK_DB_NAME="knik"

# Optional
export KNIK_HISTORY_CONTEXT_SIZE="5"
```

Apply the database schema once, and after each upgrade, with `scripts/migrate.sh`.

See [environment-variables.md](../reference/environment-variables.md) for the complete reference.

### System Dependencies

```bash
# macOS
brew install espeak-ng

# Ubuntu/Debian
sudo apt-get install espeak-ng

# Fedora/RHEL
sudo dnf install espeak-ng
```

### Python Dependencies

```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

---

## Web App Deployment

### Option 1: Manual Deployment

#### Backend (FastAPI)

**1. Install dependencies:**

```bash
pip install -r requirements.txt
```

**2. Configure production settings:**

```bash
export KNIK_WEB_HOST="0.0.0.0"
export KNIK_WEB_PORT="8010"
export KNIK_WEB_RELOAD="false"
export KNIK_WEB_CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

**3. Run the server:**

```bash
# From the repository root: reads KNIK_WEB_HOST, KNIK_WEB_PORT and KNIK_WEB_RELOAD
python src/main.py --mode backend

# Or call Uvicorn directly
uvicorn --app-dir src backend.main:app --host 0.0.0.0 --port 8010
```

Run one process. Settings changes, tool-group switches and the per-conversation AI clients are held in the
process, so several workers would drift apart.

**4. Run the worker** if you use scheduled workflows: `python src/main.py --mode worker` (the backend never runs
schedules).

**5. Set up as systemd service (Linux):**

Create `/etc/systemd/system/knik-backend.service`:

```ini
[Unit]
Description=Knik Web Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/knik
Environment="KNIK_AI_PROVIDER=vertex"
Environment="GOOGLE_CLOUD_PROJECT=your-project"
Environment="KNIK_VOICE=af_heart"
Environment="KNIK_WEB_RELOAD=false"
ExecStart=/path/to/knik/.venv/bin/python src/main.py --mode backend
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable knik-backend
sudo systemctl start knik-backend
sudo systemctl status knik-backend
```

#### Frontend (React + Vite)

**1. Build for production:**

```bash
cd src/frontend && npm run build
```

This creates optimized static files in `src/frontend/dist/`. The frontend currently runs on an in-memory
demo session and does not call the backend.

**2. Serve with Nginx:**

Create `/etc/nginx/sites-available/knik`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend static files
    location / {
        root /path/to/knik/src/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:8010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/knik /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**3. Or serve with simple static server:**

```bash
# Using Python
python -m http.server 3000 --directory src/frontend/dist

# Using Node
npx serve -s src/frontend/dist -l 3000
```

### Option 2: Platform as a Service

#### Vercel (Frontend Only)

```bash
cd src/frontend
vercel --prod
```

#### Other Platforms (Railway / Render / Fly.io)

Platform-specific deployment configs are planned for future releases.

---

## Electron Desktop App

### Build for Distribution

**1. Install dependencies:**

```bash
npm install
```

**2. Build configuration:**

Knik uses `electron-builder.yml` at the project root (its icons are not in the repository; see
[Electron Assets](../components/electron-assets.md)):

- **App ID:** `com.knik.app`
- **Product Name:** `Knik`
- **Output:** `dist-electron/`
- **macOS:** dmg + zip for arm64 and x64, hardened runtime enabled
- **Windows:** NSIS installer + portable for x64
- **Linux:** AppImage + deb for x64

**3. Build for your platform:**

```bash
# macOS (creates .dmg and .app)
npm run electron:build:mac

# Windows (creates .exe installer)
npm run electron:build:win

# Linux (creates .AppImage, .deb)
npm run electron:build:linux

# Generic (auto-detects platform)
npm run electron:build
```

**4. Find built apps:**

- macOS: `dist-electron/Knik-*.dmg`, `dist-electron/Knik-*.zip`
- Windows: `dist-electron/Knik Setup *.exe`
- Linux: `dist-electron/Knik-*.AppImage`, `dist-electron/knik_*_amd64.deb`

### Code Signing (Optional but Recommended)

#### macOS

1. Get an Apple Developer ID certificate
2. The `electron-builder.yml` already configures hardened runtime and entitlements
3. Notarize after build:

```bash
npx notarize-cli --file dist-electron/Knik-*.dmg \
  --bundle-id com.knik.app \
  --username your@apple.id \
  --password @keychain:AC_PASSWORD
```

#### Windows

1. Get a code signing certificate (.pfx file)
2. Set environment variable and build:

```bash
export CSC_LINK="./path/to/cert.pfx"
export CSC_KEY_PASSWORD="your-cert-password"
npm run electron:build:win
```

### Development Mode

```bash
# Starts backend + frontend + Electron concurrently
npm run electron:dev
```

This uses `concurrently` to run all three processes, with `wait-on` to delay Electron until the frontend dev server is ready.

---

## Console

```bash
npm run start:console
# or
python src/main.py --mode console
```

---

## Production Checklist

- [ ] Set `KNIK_AI_PROVIDER` to a real provider (not `mock`)
- [ ] Configure provider credentials (API keys, project IDs)
- [ ] Set `KNIK_WEB_CORS_ORIGINS` to your domain(s)
- [ ] Turn on `KNIK_WEB_REQUIRE_API_KEY` (create the first key while it is off; see [API keys](../reference/environment-variables.md#api-keys))
- [ ] Keep `KNIK_WEB_TOOL_CONSENT=deny` unless the deployment serves one trusted user
- [ ] Use HTTPS for web deployments
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules (ports 80/443 for web, 8010 for API)
- [ ] Apply migrations with `scripts/migrate.sh`
- [ ] Run the worker if you use scheduled workflows
- [ ] Switch off the tool groups web chats should not use (`PUT /api/admin/mcp-tools/{group}`)
- [ ] Verify TTS voice models work on production server
- [ ] Install `espeak-ng` on the server

### Security Best Practices

1. **Environment Variables** -- never commit `.env` files or credentials
2. **API Keys** -- use secret managers (AWS Secrets Manager, Google Secret Manager)
3. **CORS** -- restrict origins to your domain only
4. **Rate Limiting** -- implement rate limiting on API endpoints
5. **HTTPS** -- always use HTTPS in production
6. **Permissions** -- run backend with non-root user
7. **Updates** -- keep dependencies updated regularly

---

## Troubleshooting

### Backend Won't Start

**`ModuleNotFoundError: No module named 'fastapi'`**

```bash
pip install -r requirements.txt
```

**`google.api_core.exceptions.PermissionDenied: 403`**

```bash
gcloud auth application-default login
gcloud config set project your-project-id
```

### Frontend Build Fails

**`Module not found: Can't resolve 'react'`**

```bash
cd src/frontend && npm install
```

### Electron App Won't Build

**`Cannot find module 'electron'`**

```bash
npm install --save-dev electron electron-builder
```

**Code signing failed (macOS):**

Skip code signing for local testing:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build:mac
```

### Voice Output Not Working

**`espeak-ng: command not found`**

```bash
# macOS
brew install espeak-ng

# Linux
sudo apt-get install espeak-ng
```

### CORS Errors

Update `KNIK_WEB_CORS_ORIGINS`:

```bash
export KNIK_WEB_CORS_ORIGINS="https://yourdomain.com,http://localhost:8020"
```

---

## Related Documentation

- [Web App Architecture](../components/web-architecture.md)
- [Electron Guide](../guides/electron.md)
- [Environment Variables](../reference/environment-variables.md)
- [Setup Guide](setup.md)
- [Streaming Architecture](streaming.md)
