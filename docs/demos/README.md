# Demo Scripts

This directory contains demonstration scripts organized by functionality.

## Directory Structure

```
demo/
├── tts/       # Text-to-speech demos
├── ai/        # AI integration demos
├── console/   # Console app demos
└── mcp/       # MCP tool demos
```

## TTS Demos (`tts/`)

- **`demo.py`** -- Interactive feature showcase with multiple TTS demos
- **`async_demo.py`** -- Async TTS processing demo
- **`main_multisegment.py`** -- Multi-segment text generation example
- **`test_segments.py`** -- Comprehensive segmentation testing and analysis
- **`quick_segment_test.py`** -- Quick segmentation test

## AI Demos (`ai/`)

- **`simple_ai_tts.py`** -- Simple AI + TTS integration example
- **`ai_tts_demo.py`** -- Advanced AI + TTS demos with Vertex AI
- **`langchain_demo.py`** -- LangChain integration demo
- **`function_calling_demo.py`** -- Function calling with AI
- **`zai_comprehensive_demo.py`** -- ZAI provider demo

## Console Demos (`console/`)

- **`simple_console_demo.py`** -- Basic command processor usage
- **`console_processor_demo.py`** -- Advanced console processing features
- **`console_app_demo.py`** -- Full console app demo

## MCP Demos (`mcp/`)

- **`test_file_operations.py`** -- File operations tool testing
- **`TEST_PROMPTS.md`** -- Example prompts for MCP tool testing

## Running Demos

From the project root:

```bash
# TTS demos
python demo/tts/demo.py
python demo/tts/async_demo.py

# AI demos
python demo/ai/simple_ai_tts.py
python demo/ai/langchain_demo.py

# Console demos
python demo/console/simple_console_demo.py

# MCP demos
python demo/mcp/test_file_operations.py
```

> **Note:** All demo scripts automatically add the parent directory to the Python path for correct module imports. Make sure your virtual environment is activated before running.
