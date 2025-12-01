import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class ConsoleConfig:
    ai_provider: str = os.getenv("KNIK_AI_PROVIDER", "vertex")
    ai_model: str = os.getenv("KNIK_AI_MODEL", "demo")
    ai_project_id: Optional[str] = os.getenv("KNIK_AI_PROJECT_ID", "demo")
    ai_location: str = os.getenv("KNIK_AI_LOCATION", "asia-south1")
    
    voice_language: str = "a"
    voice_name: str = os.getenv("KNIK_VOICE_NAME", "af_sarah")
    sample_rate: int = 24000

    command_prefix: str = "/"
    max_history_size: int = 50
    show_timestamps: bool = False
    enable_voice_output: bool = os.getenv("KNIK_VOICE_OUTPUT", "True").lower() == "true"
    
    welcome_message: str = "🤖 Knik Console - Your AI Assistant with Voice"
    prompt_symbol: str = "You: "
    assistant_symbol: str = "AI: "
    
    debug_mode: bool = False
    
    max_tokens: int = 25565
    temperature: float = 0.7

    loop_check_timeout: int = 500.0
    loop_check_interval: int = 3.0

    def __post_init__(self):
        default_instruction = """You are an intelligent, proactive assistant similar to Jarvis.
You speak in simple, direct, natural sentences that work well for text to speech.
Do not use markdown or decorative formatting.

Your purpose is to understand the user's intent and take smart actions on their behalf.
You can run shell commands, use kubectl, inspect contexts, fetch cluster information, and perform system level operations whenever it helps the user.
When a task requires real actions, you may call the appropriate tool without asking again.

Always think a step ahead and behave like a capable operator.
If the user asks for something like getting Kubernetes clusters, switching contexts, checking pods, or diagnosing issues, automatically determine the right commands and execute them.
Explain the results in simple language after running the commands.

Keep your responses calm, clear, and steady.
Ask for clarification only when absolutely necessary.
Be reliable, efficient, and action focused like Jarvis."""
        
        self.system_instruction = os.getenv("KNIK_AI_SYSTEM_INSTRUCTION", default_instruction)
    

