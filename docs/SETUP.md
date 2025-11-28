# Setup Guide

## Prerequisites

- Python 3.8+
- espeak-ng

## Installation

### 1. Install espeak-ng

**macOS:**
```bash
brew install espeak-ng
```

**Linux:**
```bash
sudo apt-get install espeak-ng  # Ubuntu/Debian
sudo dnf install espeak-ng      # Fedora
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"  # For Vertex AI
```

See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for all options.

## Running

```bash
# Console app
npm run start:console

# Or directly
python src/main.py
```

## Troubleshooting

**espeak-ng not found:**
```bash
which espeak-ng  # Verify installation
```

**Import errors:**
```bash
# Run from project root
cd /path/to/knik
python src/main.py
```

**No audio:**
- Check system audio settings
- Verify espeak-ng works: `espeak-ng "test"`
