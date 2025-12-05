# Electron Migration Plan - Knik Web UI

**Date:** December 6, 2025  
**Goal:** Migrate from CustomTkinter to Electron + React + Tailwind CSS for smooth animations and modern UI

---

## 🎯 **Why Electron?**

### **Problems with Current CustomTkinter GUI:**
- ❌ Choppy animations (Canvas redraws expensive)
- ❌ No true opacity/transform support
- ❌ Grid geometry manager limits positioning
- ❌ Python GIL performance bottleneck
- ❌ Limited theming capabilities

### **Benefits of Electron Stack:**
- ✅ **Buttery smooth 60fps animations** with CSS/GPU acceleration
- ✅ **Tailwind CSS** - Simple theming, responsive design
- ✅ **Industry standard** - VS Code, Discord, Slack use Electron
- ✅ **Keep all Python logic** - Just add API layer
- ✅ **Rich ecosystem** - Tons of React components
- ✅ **Professional result** - Desktop app with web tech

---

## 📐 **New Architecture**

```
┌──────────────────────────────────────────────────────────┐
│                    ELECTRON APP                          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         CHROMIUM RENDERER PROCESS                  │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  React + TypeScript + Tailwind CSS           │ │ │
│  │  │                                              │ │ │
│  │  │  Components:                                 │ │ │
│  │  │  - GradientBackground.tsx                    │ │ │
│  │  │  - ChatPanel.tsx                             │ │ │
│  │  │  - MessageBubble.tsx                         │ │ │
│  │  │  - InputPanel.tsx                            │ │ │
│  │  │  - SettingsPanel.tsx                         │ │ │
│  │  │  - TopBar.tsx                                │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                      ↕ ↕ ↕                        │ │
│  │              REST API / WebSocket                 │ │
│  └────────────────────────────────────────────────────┘ │
│                        ↕ ↕ ↕                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │         ELECTRON MAIN PROCESS (Node.js)           │ │
│  │                                                    │ │
│  │  - Window management                              │ │
│  │  - IPC communication                              │ │
│  │  - Python subprocess control                      │ │
│  │  - Auto-start backend                             │ │
│  └────────────────────────────────────────────────────┘ │
│                        ↕ ↕ ↕                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │         PYTHON BACKEND (FastAPI)                  │ │
│  │                                                    │ │
│  │  Endpoints:                                        │ │
│  │  - POST /api/chat         (AIClient)              │ │
│  │  - WS   /ws/stream        (Streaming)             │ │
│  │  - POST /api/tts          (TTSAsyncProcessor)     │ │
│  │  - GET  /api/tools        (MCP Tools)             │ │
│  │  - GET  /api/history      (ConversationHistory)   │ │
│  │  - GET  /api/settings     (Config)                │ │
│  │                                                    │ │
│  │  Existing Code (UNCHANGED):                        │ │
│  │  - src/lib/core/                                   │ │
│  │  - src/lib/services/                               │ │
│  │  - src/lib/mcp/                                    │ │
│  │  - src/apps/console/history.py                    │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 **New Project Structure**

```
knik/
├── package.json                    # Electron + frontend deps
├── electron/                       # Electron main process
│   ├── main.js                     # Window management
│   ├── preload.js                  # Secure IPC bridge
│   └── python-manager.js           # Python subprocess control
│
├── frontend/                       # React app
│   ├── package.json
│   ├── vite.config.ts              # Vite bundler config
│   ├── tailwind.config.js          # Tailwind customization
│   ├── postcss.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                # Entry point
│   │   ├── App.tsx                 # Root component
│   │   ├── index.css               # Tailwind imports
│   │   │
│   │   ├── components/             # React components
│   │   │   ├── GradientBackground.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── InputPanel.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── TopBar.tsx
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useChat.ts
│   │   │   ├── useTTS.ts
│   │   │   └── useTheme.ts
│   │   │
│   │   ├── services/               # API clients
│   │   │   ├── api.ts              # REST API client
│   │   │   └── websocket.ts        # WebSocket client
│   │   │
│   │   ├── store/                  # State management
│   │   │   ├── chatStore.ts        # Chat state
│   │   │   ├── settingsStore.ts    # Settings state
│   │   │   └── themeStore.ts       # Theme state
│   │   │
│   │   └── types/                  # TypeScript types
│   │       ├── message.ts
│   │       ├── settings.ts
│   │       └── api.ts
│   │
│   └── dist/                       # Built frontend (output)
│
├── src/                            # Python backend
│   ├── apps/
│   │   ├── web/                    # NEW: Web backend
│   │   │   ├── __init__.py
│   │   │   ├── main.py             # FastAPI app entry
│   │   │   ├── config.py           # Backend config
│   │   │   │
│   │   │   ├── routes/             # API endpoints
│   │   │   │   ├── __init__.py
│   │   │   │   ├── chat.py         # Chat endpoints
│   │   │   │   ├── tts.py          # TTS endpoints
│   │   │   │   ├── tools.py        # MCP tools endpoints
│   │   │   │   ├── history.py      # History endpoints
│   │   │   │   └── settings.py     # Settings endpoints
│   │   │   │
│   │   │   ├── websocket/          # Real-time communication
│   │   │   │   ├── __init__.py
│   │   │   │   └── stream.py       # Streaming responses
│   │   │   │
│   │   │   └── models/             # Pydantic models
│   │   │       ├── __init__.py
│   │   │       ├── chat.py
│   │   │       ├── tts.py
│   │   │       └── settings.py
│   │   │
│   │   ├── console/                # EXISTING: Console app
│   │   └── gui/                    # OLD: Can archive/remove
│   │
│   ├── lib/                        # EXISTING: Keep unchanged
│   │   ├── core/
│   │   ├── services/
│   │   ├── mcp/
│   │   └── utils/
│   │
│   └── main.py                     # Updated launcher
│
├── docs/
│   └── WEB_MIGRATION.md            # This file
│
└── dist/                           # Built Electron app (output)
    ├── Knik-darwin-arm64/          # macOS app
    ├── Knik-win32-x64/             # Windows app
    └── Knik-linux-x64/             # Linux app
```

---

## 🛠️ **Implementation Plan**

### **Phase 1: Backend API Layer** (4-6 hours)

#### **Step 1.1: Setup FastAPI Project**
```bash
cd src/apps/web
pip install fastapi uvicorn websockets python-multipart pydantic
```

#### **Step 1.2: Create FastAPI App**
```python
# src/apps/web/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import chat, tts, tools, history, settings
from .websocket import stream

app = FastAPI(title="Knik Backend API")

# CORS for Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(tts.router, prefix="/api/tts", tags=["tts"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(stream.router, prefix="/ws", tags=["websocket"])

@app.get("/")
def health_check():
    return {"status": "healthy", "app": "Knik Backend"}
```

#### **Step 1.3: Create API Endpoints** (Examples)

**Chat Endpoint:**
```python
# src/apps/web/routes/chat.py
from fastapi import APIRouter, HTTPException
from ..models.chat import ChatRequest, ChatResponse
from imports import AIClient

router = APIRouter()

# Initialize AIClient (singleton)
ai_client = AIClient(provider="vertex")

@router.post("/query", response_model=ChatResponse)
async def chat_query(request: ChatRequest):
    try:
        response = ai_client.query(request.message, context=request.context)
        return ChatResponse(
            message=response,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**WebSocket Streaming:**
```python
# src/apps/web/websocket/stream.py
from fastapi import APIRouter, WebSocket
from imports import AIClient

router = APIRouter()

@router.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # Stream AI response word by word
            async for chunk in ai_client.query_stream(data):
                await websocket.send_text(chunk)
                
    except WebSocketDisconnect:
        print("Client disconnected")
```

---

### **Phase 2: Frontend Setup** (3-4 hours)

#### **Step 2.1: Create React + Vite Project**
```bash
cd knik
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

#### **Step 2.2: Install Dependencies**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

npm install axios zustand framer-motion
npm install lucide-react  # Icon library
```

#### **Step 2.3: Configure Tailwind**
```js
// frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#5B4FFF',
        secondary: '#8B92FF',
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-in': 'fade-in 0.2s ease-in',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(50px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-50px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

#### **Step 2.4: Create Base Components**

**GradientBackground.tsx:**
```tsx
export const GradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br 
                    from-blue-900 via-purple-900 to-teal-900 
                    bg-[length:200%_200%] animate-gradient-shift" />
  );
};
```

**MessageBubble.tsx:**
```tsx
interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  isSystem: boolean;
}

export const MessageBubble = ({ message, isUser, isSystem }: MessageBubbleProps) => {
  const baseClasses = "rounded-2xl p-4 max-w-2xl";
  const animationClass = isUser ? "animate-slide-in-right" : "animate-slide-in-left";
  
  if (isSystem) {
    return (
      <div className="flex justify-center animate-fade-in">
        <div className="bg-gray-800/50 text-gray-400 text-sm rounded-lg px-4 py-2">
          🔧 {message}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${animationClass}`}>
      <div className={`${baseClasses} ${
        isUser 
          ? 'bg-primary text-white' 
          : 'bg-gray-800 text-gray-100'
      }`}>
        {!isUser && <div className="text-xs text-secondary mb-1">🤖 Knik</div>}
        <p className="whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
};
```

---

### **Phase 3: Electron Integration** (2-3 hours)

#### **Step 3.1: Install Electron**
```bash
cd knik
npm install --save-dev electron electron-builder concurrently wait-on
```

#### **Step 3.2: Create Electron Main Process**
```js
// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

// Start Python backend
function startPythonBackend() {
  const pythonPath = path.join(__dirname, '../.venv/bin/python');
  const scriptPath = path.join(__dirname, '../src/apps/web/main.py');
  
  pythonProcess = spawn(pythonPath, [scriptPath]);
  
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

app.whenReady().then(() => {
  startPythonBackend();
  
  // Wait for backend to start
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (pythonProcess) pythonProcess.kill();
  app.quit();
});
```

#### **Step 3.3: Update Package.json**
```json
{
  "name": "knik",
  "version": "2.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\" \"npm run dev:electron\"",
    "dev:backend": "cd src/apps/web && uvicorn main:app --reload --port 8000",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "npm run build:frontend && electron-builder",
    "build:frontend": "cd frontend && npm run build"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0",
    "concurrently": "^8.0.0",
    "wait-on": "^7.0.0"
  },
  "build": {
    "appId": "com.knik.app",
    "productName": "Knik",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron/**/*",
      "frontend/dist/**/*",
      "src/**/*",
      ".venv/**/*"
    ],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

---

### **Phase 4: Animation Implementation** (2-3 hours)

#### **Smooth Gradient Background**
```tsx
// Already in Tailwind config - just use:
<div className="bg-gradient-to-br from-blue-900 via-purple-900 to-teal-900 
                bg-[length:200%_200%] animate-gradient-shift" />
```

#### **Message Animations with Stagger**
```tsx
const MessageList = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((msg, index) => (
        <div
          key={msg.id}
          style={{ animationDelay: `${index * 50}ms` }}
          className={msg.isUser ? 'animate-slide-in-right' : 'animate-slide-in-left'}
        >
          <MessageBubble {...msg} />
        </div>
      ))}
    </div>
  );
};
```

#### **Word-by-Word Text Reveal**
```tsx
const AnimatedText = ({ text }: { text: string }) => {
  const words = text.split(' ');
  
  return (
    <span>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block animate-fade-in"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {word}{' '}
        </span>
      ))}
    </span>
  );
};
```

---

## 📊 **Migration Timeline**

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Backend API Layer | 4-6h | Not Started |
| 2 | Frontend Setup | 3-4h | Not Started |
| 3 | Electron Integration | 2-3h | Not Started |
| 4 | Animation Implementation | 2-3h | Not Started |
| 5 | Testing & Polish | 3-4h | Not Started |
| **Total** | **Full Migration** | **14-20h** | **0% Complete** |

---

## 🎯 **What We Keep vs What Changes**

### **✅ KEEP (No Changes Required):**
- `src/lib/` - All core logic, services, MCP tools
- `src/apps/console/` - Console app still works
- `imports.py` - Central import hub
- All Python dependencies and environment
- Conversation history, TTS, AI client logic

### **🆕 NEW (Add These):**
- `frontend/` - React + Tailwind UI
- `electron/` - Electron main process
- `src/apps/web/` - FastAPI backend API layer
- Node.js dependencies (package.json)

### **🗑️ REMOVE (Can Archive):**
- `src/apps/gui/` - CustomTkinter GUI (no longer needed)
- CustomTkinter animations (replaced by CSS)

---

## 🚀 **Next Steps**

1. **Review this plan** - Make sure architecture makes sense
2. **Choose starting point:**
   - Start with backend API (Python comfort zone)
   - Start with frontend UI (see results quickly)
   - Start with Electron setup (full stack)

3. **Set up development environment:**
   ```bash
   # Install Node.js (if not already)
   brew install node  # macOS
   
   # Verify
   node --version
   npm --version
   ```

4. **Begin Phase 1** - Which phase would you like to start with?

---

## 💡 **Expected Results**

**After migration, you'll have:**
- ✅ **Smooth 60fps animations** (gradient, slide-ins, text reveal)
- ✅ **Modern desktop app** (single .app/.exe file)
- ✅ **Beautiful UI** (Tailwind makes it easy)
- ✅ **Professional feel** (like VS Code, Discord)
- ✅ **All Python logic intact** (just accessed via API)
- ✅ **Easy to extend** (React component ecosystem)

**Animation comparison:**
- CustomTkinter: 15-30fps, choppy, limited
- Electron + CSS: 60fps, buttery smooth, GPU-accelerated ✨

---

Ready to start? Let me know which phase you'd like to tackle first! 🎊
