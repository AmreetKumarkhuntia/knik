# Quick Start Guide - Working with Knik

## 🚀 Starting Fresh

When starting a new session with Copilot, reference these key points:

### What Knik Is

- AI assistant with voice (TTS) and chat capabilities
- Two modes: GUI (CustomTkinter) and Console (terminal)
- 20+ built-in MCP tools (file ops, calculations, text processing, shell commands)
- Conversation history for context-aware responses
- Dynamic light/dark theme switching

### Current State (December 5, 2025)

✅ Theme system fully implemented
✅ Conversation history working
✅ Code quality optimized (all lint checks passing)
✅ Tool callback bug fixed
⏳ Animations planned but not implemented yet

---

## 📁 Project Structure

```
src/
├── main.py                 # App launcher
├── imports.py             # Central import hub
├── lib/                   # Reusable library
│   ├── core/             # TTS async processor
│   ├── services/         # AI client, voice, audio
│   └── mcp/              # 20 MCP tools
└── apps/
    ├── console/          # Terminal chat app
    │   ├── app.py
    │   ├── history.py    # Conversation history
    │   └── tools/        # /commands
    └── gui/              # Desktop GUI app
        ├── app.py
        ├── theme.py      # Theme system ⭐
        └── components/   # UI widgets
```

---

## 🎨 Theme System (New!)

### Files

- `src/apps/gui/theme.py` - **All theme logic here**
- Defines: DarkTheme, LightTheme, ColorTheme, Fonts, Spacing

### Usage

```python
from .theme import ColorTheme, Fonts, Spacing

# Switching themes
ColorTheme.set_mode("light")  # or "dark" or "system"

# Using colors
button = ctk.CTkButton(
    fg_color=ColorTheme.BTN_PRIMARY,
    text_color=ColorTheme.TEXT_PRIMARY,  # ⚠️ Always set this!
    ...
)
```

### Refreshing UI After Theme Change

```python
def _refresh_theme(self):
    # Update all widgets
    self.root.configure(fg_color=ColorTheme.BG_PRIMARY)
    self.chat_panel.refresh_theme()  # Rebuilds messages
    # ... update buttons, panels, etc.
```

---

## 🏃 Running & Testing

```bash
# Run GUI (most common)
npm run start:gui

# Run Console
npm run start:console

# Code quality
npm run lint          # Check
npm run lint:fix      # Auto-fix
npm run format        # Format all code

# Git workflow
git status
git add -A
git commit -m "feat: description"
git push
```

---

## 🐛 Common Issues & Solutions

### Issue: Button text not visible

**Solution:** Always add `text_color` parameter to buttons

```python
ctk.CTkButton(..., text_color=ColorTheme.TEXT_PRIMARY)
```

### Issue: Theme not updating

**Solution:** Call both `ColorTheme.set_mode()` AND `_refresh_theme()`

### Issue: Import errors

**Solution:** Use `from imports import ...` instead of direct imports

### Issue: Emoji not showing in GUI

**Solution:** Use text instead - CustomTkinter has limited emoji support

---

## 📝 Code Style Rules

1. **Self-documenting code** - avoid useless comments
2. **Small modules** - break down complex logic
3. **Helper functions** - for shared logic
4. **Type hints** - use them consistently
5. **Store widget references** - as self.\* for later updates
6. **Text colors on buttons** - always explicit for theme support

---

## 🎯 Next Tasks (Animation Plan)

### Recommended Order:

1. **Status Pulse** (#10) - Pulse dot when processing ⭐ Start here
2. **Typing Indicator** (#3) - 3-dot animation while AI thinks
3. **Message Pop-in** (#8) - Scale effect on new messages

### All 10 Tasks:

- [ ] Smooth sliding animations
- [ ] Typing indicator ⭐
- [ ] Background gradient
- [ ] Settings slide-in
- [ ] Smooth scroll
- [ ] Button hover effects
- [ ] Message pop-in ⭐
- [ ] Input gradient overlay
- [ ] Status pulse ⭐

---

## 📚 Key Documentation

- `.github/copilot-instructions.md` - **Main reference** (updated!)
- `docs/GUI.md` - GUI architecture
- `docs/CONVERSATION_HISTORY.md` - History system
- `docs/MCP.md` - MCP tools reference
- `SESSION_SUMMARY.md` - This session's work

---

## 💡 Quick Commands Reference

```bash
# From project root
npm run start:gui                    # Launch GUI
npm run lint:fix && npm run format  # Clean code
git add -A && git commit -m "msg"   # Commit

# From Python
from imports import AIClient, TTSAsyncProcessor, printer, ColorTheme
ColorTheme.set_mode("light")  # Switch theme
```

---

## 🎨 Color Palette Quick Reference

### Dark Theme

- Background: `#0F1419` (almost black)
- User bubbles: `#5B4FFF` (purple)
- AI bubbles: `#2D3142` (dark gray)
- Text: `#FFFFFF` (white)

### Light Theme

- Background: `#FFFFFF` (white)
- User bubbles: `#5B4FFF` (purple - same!)
- AI bubbles: `#E5E5EA` (light gray)
- Text: `#000000` (black)

---

**Last Updated:** December 5, 2025
**Status:** Ready for Animation Implementation
**Next Session:** Pick animation from plan and implement
