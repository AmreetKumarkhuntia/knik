# Deployment Guide

This guide covers deploying Knik applications for production use.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Web App Deployment](#web-app-deployment)
- [Electron Desktop App](#electron-desktop-app)
- [Console/GUI Apps](#consolegui-apps)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Required Environment Variables

```bash
# AI Provider Configuration
export KNIK_AI_PROVIDER="vertex"  # or "mock"
export KNIK_AI_MODEL="gemini-2.0-flash-exp"
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Voice Configuration
export KNIK_VOICE_NAME="af_sarah"  # Female voice
# or: export KNIK_VOICE_NAME="am_adam"  # Male voice

# Web App Configuration
export KNIK_WEB_HOST="0.0.0.0"  # Listen on all interfaces
export KNIK_WEB_PORT="8000"
export KNIK_WEB_CORS_ORIGINS="https://yourdomain.com"

# Optional: History Configuration
export KNIK_HISTORY_CONTEXT_SIZE="5"  # Number of messages to send as context
```

See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for complete reference.

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

### Option 1: Docker (Recommended)

**Coming Soon** - Docker configuration is planned for future releases.

### Option 2: Manual Deployment

#### Backend (FastAPI)

**1. Install dependencies:**

```bash
cd src/apps/web
pip install -r requirements.txt  # If separate, or use main requirements.txt
```

**2. Configure production settings:**

```bash
export KNIK_WEB_HOST="0.0.0.0"
export KNIK_WEB_PORT="8000"
export KNIK_WEB_CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

**3. Run with production ASGI server:**

```bash
# Using Uvicorn (included)
cd src/apps/web/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Or using Gunicorn + Uvicorn workers
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

**4. Set up as systemd service (Linux):**

Create `/etc/systemd/system/knik-backend.service`:

```ini
[Unit]
Description=Knik Web Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/knik/src/apps/web/backend
Environment="KNIK_AI_PROVIDER=vertex"
Environment="GOOGLE_CLOUD_PROJECT=your-project"
Environment="KNIK_VOICE_NAME=af_sarah"
ExecStart=/path/to/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
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
cd src/apps/web/frontend
npm install
npm run build
```

This creates optimized static files in `dist/`.

**2. Serve with Nginx:**

Create `/etc/nginx/sites-available/knik`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS (if using SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration (if using SSL)
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend static files
    location / {
        root /path/to/knik/src/apps/web/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
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
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

**3. Or serve with simple static server:**

```bash
# Using Python http.server
cd src/apps/web/frontend/dist
python -m http.server 3000

# Using Node serve package
npx serve -s dist -l 3000
```

### Option 3: Platform as a Service (PaaS)

#### Vercel (Frontend Only)

```bash
cd src/apps/web/frontend
vercel --prod
```

Configure environment variables in Vercel dashboard:
- `VITE_API_BASE_URL`: Your backend URL

#### Railway / Render / Fly.io (Full Stack)

**Coming Soon** - Platform-specific deployment configs planned.

---

## Electron Desktop App

### Build for Distribution

**1. Install Electron dependencies:**

```bash
npm install
```

**2. Add app icons:**

Place icons in `assets/` directory:
- `icon.icns` - macOS (512x512 PNG → ICNS)
- `icon.ico` - Windows (256x256 PNG → ICO)
- `icon.png` - Linux (512x512 PNG)

Use tools like [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder):

```bash
npx electron-icon-builder --input=./assets/icon-source.png --output=./assets/
```

**3. Build for your platform:**

```bash
# macOS (creates .dmg and .app)
npm run electron:build:mac

# Windows (creates .exe installer)
npm run electron:build:win

# Linux (creates .AppImage, .deb, .rpm)
npm run electron:build:linux

# Build for all platforms
npm run electron:build:all
```

**4. Find built apps:**

- macOS: `dist/Knik-1.0.0-arm64.dmg`, `dist/Knik-1.0.0-x64.dmg`
- Windows: `dist/Knik Setup 1.0.0.exe`
- Linux: `dist/Knik-1.0.0.AppImage`, `dist/knik_1.0.0_amd64.deb`

### Code Signing (Optional but Recommended)

#### macOS

1. Get Apple Developer ID certificate
2. Add to `electron-builder.yml`:

```yaml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: "./assets/entitlements.mac.plist"
  entitlementsInherit: "./assets/entitlements.mac.plist"
```

3. Notarize after build:

```bash
npx notarize-cli --file dist/Knik-1.0.0.dmg \
  --bundle-id com.knik.app \
  --username your@apple.id \
  --password @keychain:AC_PASSWORD
```

#### Windows

1. Get code signing certificate (.pfx file)
2. Add to `electron-builder.yml`:

```yaml
win:
  certificateFile: "./path/to/cert.pfx"
  certificatePassword: "${CERT_PASSWORD}"
```

3. Set environment variable:

```bash
export CERT_PASSWORD="your-cert-password"
npm run electron:build:win
```

### Distribution

**macOS:**
- Upload `.dmg` to website
- Or submit to Mac App Store (requires Apple Developer Program)

**Windows:**
- Upload `.exe` installer to website
- Or publish to Microsoft Store

**Linux:**
- Upload `.AppImage` (universal) to website
- Publish `.deb` to Ubuntu/Debian repositories
- Publish `.rpm` to Fedora/RHEL repositories

---

## Console/GUI Apps

### Standalone Python Distribution

**Option 1: PyInstaller**

```bash
pip install pyinstaller

# Console app
pyinstaller --onefile src/main.py --name knik-console -- --mode console

# GUI app
pyinstaller --onefile --windowed src/main.py --name knik-gui -- --mode gui
```

**Option 2: Briefcase (Recommended for GUI)**

```bash
pip install briefcase

# Create Briefcase project
briefcase new

# Build
briefcase build
briefcase package
```

### System Package Distribution

**Debian/Ubuntu (.deb):**

Create `debian/` directory structure and use `dpkg-deb`.

**RHEL/Fedora (.rpm):**

Create `.spec` file and use `rpmbuild`.

**macOS (.pkg):**

Use `pkgbuild` and `productbuild`.

---

## Configuration

### Production Checklist

- [ ] Set `KNIK_AI_PROVIDER` to `vertex` (not `mock`)
- [ ] Configure `GOOGLE_CLOUD_PROJECT` with valid project ID
- [ ] Set `KNIK_WEB_CORS_ORIGINS` to your domain(s)
- [ ] Use HTTPS for web deployments (SSL/TLS certificates)
- [ ] Set up monitoring and logging (see [WEB_APP.md](WEB_APP.md))
- [ ] Configure firewall rules (open ports 80/443 for web, 8000 for API)
- [ ] Set up backup strategy for conversation history (if persistent storage added)
- [ ] Test all MCP tools in production environment
- [ ] Verify voice models work on production server

### Security Best Practices

1. **Environment Variables**: Never commit `.env` files or credentials
2. **API Keys**: Use secret managers (AWS Secrets Manager, Google Secret Manager)
3. **CORS**: Restrict origins to your domain only
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **HTTPS**: Always use HTTPS in production
6. **Permissions**: Run backend with non-root user
7. **Updates**: Keep dependencies updated regularly

---

## Troubleshooting

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:** Install dependencies:

```bash
cd src/apps/web/backend
pip install -r requirements.txt
```

**Error:** `google.api_core.exceptions.PermissionDenied: 403 Permission denied`

**Solution:** Check Google Cloud authentication:

```bash
gcloud auth application-default login
gcloud config set project your-project-id
```

### Frontend Build Fails

**Error:** `Module not found: Can't resolve 'react'`

**Solution:** Install dependencies:

```bash
cd src/apps/web/frontend
npm install
```

**Error:** `TypeScript errors during build`

**Solution:** Fix type errors or skip type checking (not recommended):

```bash
npm run build -- --mode production --no-type-check
```

### Electron App Won't Build

**Error:** `Cannot find module 'electron'`

**Solution:** Install Electron:

```bash
npm install --save-dev electron electron-builder
```

**Error:** `Code signing failed (macOS)`

**Solution:** Either:
- Skip code signing: `CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build:mac`
- Or set up proper certificates (see Code Signing section)

### Voice Output Not Working

**Error:** `espeak-ng: command not found`

**Solution:** Install espeak-ng:

```bash
# macOS
brew install espeak-ng

# Linux
sudo apt-get install espeak-ng
```

**Error:** Audio plays but no sound

**Solution:** Check system audio settings and permissions.

### CORS Errors

**Error:** `Access-Control-Allow-Origin` header missing

**Solution:** Update `KNIK_WEB_CORS_ORIGINS`:

```bash
export KNIK_WEB_CORS_ORIGINS="https://yourdomain.com,http://localhost:5173"
```

---

## Additional Resources

- [WEB_APP.md](WEB_APP.md) - Web app architecture and API reference
- [ELECTRON.md](ELECTRON.md) - Electron desktop app guide
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Configuration reference
- [SETUP.md](SETUP.md) - Initial setup guide

For questions or issues, please open an issue on GitHub or consult the documentation.
