# Demo Scripts

This directory contains demonstration scripts organized by functionality.

## Directory Structure

```
demo/
├── tts/          # Text-to-Speech demos
├── ai/           # AI integration demos
└── console/      # Console processor demos
```

## TTS Demos (`tts/`)

- **`demo.py`** - Interactive feature showcase with multiple TTS demos
- **`test_segments.py`** - Comprehensive segmentation testing and analysis
- **`quick_segment_test.py`** - Quick segmentation test
- **`main_multisegment.py`** - Multi-segment text generation example

## AI Demos (`ai/`)

- **`simple_ai_tts.py`** - Simple AI + TTS integration example
- **`ai_tts_demo.py`** - Advanced AI + TTS demos with Vertex AI

## Console Demos (`console/`)

- **`simple_console_demo.py`** - Basic command processor usage
- **`console_processor_demo.py`** - Advanced console processing features

## Running Demos

From the project root:

```bash
# TTS demos
python src/demo/tts/demo.py
python src/demo/tts/test_segments.py

# AI demos
python src/demo/ai/simple_ai_tts.py
python src/demo/ai/ai_tts_demo.py

# Console demos
python src/demo/console/simple_console_demo.py
```

## Quick Start

```bash
# Basic TTS
python src/demo/tts/demo.py

# AI + TTS
python src/demo/ai/simple_ai_tts.py

# Console processor
python src/demo/console/simple_console_demo.py
```

## Note

All demo scripts automatically add the parent directory to the Python path for correct module imports.
