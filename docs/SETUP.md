# Setup Guide

## Prerequisites

- Python 3.12+
- espeak-ng

## Installation

```bash
# 1. Install espeak-ng
brew install espeak-ng  # macOS
# or
sudo apt-get install espeak-ng  # Ubuntu/Debian

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure (optional, for Vertex AI)
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

## Run

```bash
npm run start:console
```

## Troubleshooting

- **No espeak-ng**: `which espeak-ng` to verify
- **Import errors**: Run from project root
- **No audio**: Check `espeak-ng "test"`
