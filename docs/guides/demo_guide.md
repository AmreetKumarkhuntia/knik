# Demo Scripts Guide

This guide explains all the demo scripts available in `src/demo/` and how to use them.

## Running Demo Scripts

All demo scripts should be run from the project root directory:

```bash
# Make sure you're in the knik directory
cd /path/to/knik

# Activate virtual environment
source .venv/bin/activate

# Run any demo script
python demo/tts/<script_name>.py
python demo/console/<script_name>.py
python demo/ai/<script_name>.py
```

---

## 1. TTS Feature Showcase Demo (`demo/tts/demo.py`)

**Purpose**: Interactive demo showcasing all major TTS features of the library.

**Run**:
```bash
python demo/tts/demo.py
```

**Features Demonstrated**:

### Demo 1: Streaming Playback
- Generates speech and plays it directly through speakers
- Shows real-time audio streaming capability

### Demo 2: Save Audio to File
- Synthesizes complete audio
- Saves output to `output/demo_output.wav`
- Demonstrates file I/O operations

### Demo 3: Multiple Voice Comparison
- Compares different voices (af_heart, am_adam, af_bella)
- Plays the same text with each voice
- Helps you choose your preferred voice

### Demo 4: Save Audio Segments
- Generates longer text that splits into segments
- Saves each segment as a separate file
- Creates files in `output/segments/` directory

### Demo 5: Custom Text Input
- Interactive mode
- Lets you choose voice and enter custom text
- Great for testing your own content

**Usage Tips**:
- Choose option 'all' to run all demos sequentially
- Choose 1-5 to run specific demos
- Press Ctrl+C to interrupt at any time

---

## 2. Segmentation Tests (`test_segments.py`)

**Purpose**: Understand how and when text gets split into multiple segments.

**Run**:
```bash
python src/demo/test_segments.py
```

**Tests Available**:

### Test 1: Short Text (Single Segment)
- Demonstrates text that stays as one segment
- Typical for short sentences

### Test 2: Multiple Sentences
- Shows how multiple clear sentences create segments
- Each sentence may become its own segment

### Test 3: Long Paragraph
- Demonstrates segmentation with longer text
- Shows how the model handles extended content

### Test 4: Text with Pauses
- Shows how punctuation affects segmentation
- Periods, commas, and line breaks influence splitting

### Test 5: Detailed Segment Analysis
- Provides detailed information about each segment:
  - Graphemes (written text)
  - Phonemes (pronunciation)
  - Audio samples count
  - Duration in seconds
- Shows total segment count and duration

**Usage Tips**:
- Run test 5 first to understand segmentation mechanics
- Experiment with different text patterns
- Note how punctuation influences segment boundaries

---

## 3. Console App Demo (`demo/console/console_app_demo.py`)

**Purpose**: Demonstrates the interactive AI console application.

**Run**:
```bash
python demo/console/console_app_demo.py
```

**Features Demonstrated**:
- Interactive AI chat with voice responses
- Command processing
- Conversation history
- Voice model integration

---

## 4. AI + TTS Integration (`demo/ai/simple_ai_tts.py`)

**Purpose**: Shows basic AI query with voice response.

**Run**:
```bash
python demo/ai/simple_ai_tts.py
```

**Features Demonstrated**:
- Query AI model
- Convert response to speech
- Stream audio playback

---

## 5. Quick Segment Test (`demo/tts/quick_segment_test.py`)

**Purpose**: Fast, simple test to see segmentation in action.

**Run**:
```bash
python demo/tts/quick_segment_test.py
```

**What It Does**:
- Provides several example texts (commented out)
- Shows segment count and details
- Plays each segment as it's generated

**How to Use**:
1. Open the file in an editor
2. Comment/uncomment different text examples
3. Run the script to see how each text is segmented

**Example Patterns Included**:
- Short text (1 segment)
- Multiple sentences (multiple segments)
- Long paragraph (many segments)
- List format (one per item)

**Tips**:
- Edit the text variable to test your own content
- Great for quick experimentation
- Shows both text content and duration per segment

---

## 6. Multi-Segment Example (`demo/tts/main_multisegment.py`)

**Purpose**: Demonstrates multi-segment text generation.

**Run**:
```bash
python demo/tts/main_multisegment.py
```

**What It Shows**:
- How to structure text for multiple segments
- Clean output format showing each segment
- Progress indication during playback

**Key Differences from main.py**:
- Uses text designed to create multiple segments
- Shows segment numbers during playback
- Demonstrates structured multi-sentence input

**Usage Tips**:
- Use as a template for your own applications
- Shows best practices for multi-segment text
- Good starting point for understanding the flow

---

## Understanding Segmentation

### When Text Becomes Multiple Segments:

1. **Multiple Sentences**:
   ```
   "First sentence. Second sentence. Third sentence."
   → 3 segments
   ```

2. **Line Breaks**:
   ```
   "First line
   Second line
   Third line"
   → 3 segments
   ```

3. **Long Text**:
   ```
   "Very long continuous text that exceeds a certain length..."
   → May split automatically
   ```

4. **Lists**:
   ```
   "First: item one.
   Second: item two.
   Third: item three."
   → 3 segments
   ```

### When Text Stays Single Segment:

- Short sentences
- Continuous flow without breaks
- Text under ~50 words without periods

---

## Output Directories

Demo scripts create these directories automatically:

```
knik/
├── output/
│   ├── demo_output.wav         # From demo.py (Demo 2)
│   └── segments/               # From demo.py (Demo 4)
│       ├── demo_segment_0.wav
│       ├── demo_segment_1.wav
│       └── ...
```

---

## Common Options

All demo scripts support:
- **Ctrl+C**: Interrupt execution
- **Voice Selection**: Most allow choosing different voices
- **Custom Text**: Several support custom input

---

## Troubleshooting

### Script Not Found
```bash
# Make sure you're in the project root
pwd  # Should show: /path/to/knik

# Check if file exists
ls src/demo/
```

### Import Errors
```bash
# Activate virtual environment
source .venv/bin/activate

# Verify Python path
python -c "import sys; print(sys.executable)"
```

### Audio Not Playing
- Check speaker volume
- Verify audio device is working
- Try running: `python -c "from lib import AudioProcessor; print(AudioProcessor().get_devices())"`

### Permission Errors
```bash
# Create output directory manually
mkdir -p output/segments
```

---

## Next Steps

After exploring the demos:

1. **Modify main.py** - Customize for your use case
2. **Create Your Own Script** - Use the library in your projects
3. **Experiment with Voices** - Find your preferred voice
4. **Test Different Languages** - Try non-English content
5. **Integrate with Apps** - Build TTS into your applications

---

## 6. AI + TTS Integration Demo (`ai_tts_demo.py`)

**Purpose**: Demonstrates AI integration with text-to-speech.

**Run**:
```bash
python src/demo/ai_tts_demo.py
```

**Prerequisites**:
- Google Cloud Project with Vertex AI enabled (optional, falls back to mock)
- Set `GOOGLE_CLOUD_PROJECT` environment variable

**Features Demonstrated**:

### Demo 1: Basic AI Query + TTS
- Queries AI with a question
- Speaks the response using TTS
- Shows simple AI-to-speech workflow

### Demo 2: Interactive Conversation
- Real-time chat with AI
- Speak responses as you go
- Change voices on the fly
- Type 'quit' to exit, 'voice' to change voice

### Demo 3: Contextual Conversation
- Multi-turn conversation with context
- AI remembers previous exchanges
- Shows how context improves responses

### Demo 4: Custom AI Personality
- Uses system instructions to set personality
- Example: Pirate personality
- Shows creative AI customization

### Demo 5: Save Responses to Files
- Query AI multiple times
- Save each response as audio file
- Creates files in `output/ai_responses/`

**Configuration**:
```python
# In the demo file, configure your settings:
ai_client = AIClient(
    provider='vertex',
    project_id='your-project-id',
    location='us-central1',
    model_name='gemini-1.5-flash'
)
```

---

## 7. Simple AI + TTS Example (`simple_ai_tts.py`)

**Purpose**: Minimal example of AI + TTS workflow.

**Run**:
```bash
python src/demo/simple_ai_tts.py
```

**What it does**:
- Step-by-step AI + TTS process
- Clear, commented code for learning
- Single question/answer demonstration

---

## Quick Reference

| Script | Purpose | Output |
|--------|---------|--------|
| `demo.py` | Feature showcase | Interactive + Files |
| `test_segments.py` | Segmentation analysis | Audio playback |
| `quick_segment_test.py` | Quick testing | Audio playback |
| `main_multisegment.py` | Multi-segment example | Audio playback |
| `ai_tts_demo.py` | AI + TTS integration | Interactive + Files |
| `simple_ai_tts.py` | Simple AI example | Audio playback |

---

For more information, see:
- [Main Documentation](./README.md)
- [Library Reference](./library_reference.md)
- [AI Client Guide](./ai_client_guide.md)
- [AI Client Quick Reference](./ai_client_quick.md)
