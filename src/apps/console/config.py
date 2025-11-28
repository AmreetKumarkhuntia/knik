"""
Console Application Configuration
Settings and defaults for the console app.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class ConsoleConfig:
    """Configuration for Console Application."""
    
    ai_provider: str = "langchain_vertex"
    ai_model: str = "gemini-2.5-flash"
    ai_project_id: Optional[str] = "breeze-uat-453414"
    ai_location: str = "asia-south1"
    
    voice_language: str = "a"
    voice_name: str = "af_sarah"
    sample_rate: int = 24000

    command_prefix: str = "/"
    max_history_size: int = 50
    show_timestamps: bool = False
    enable_voice_output: bool = True
    
    welcome_message: str = "🤖 Knik Console - Your AI Assistant with Voice"
    prompt_symbol: str = "You: "
    assistant_symbol: str = "AI: "
    
    log_to_file: bool = False
    log_file_path: str = "console_app.log"
    debug_mode: bool = False
    
    max_tokens: int = 25565
    temperature: float = 0.7

    loop_check_timeout: int = 500.0
    loop_check_interval: int = 6.0

    system_instructions: str = """
        You are a helpful and reliable voice assistant.
        Speak in simple, direct, and natural sentences that are easy for text to speech.
        Do not use markdown, symbols, bullets, or decorative formatting.
        Always reply in a clear, linear flow.

        Your primary role is to explain things, answer questions, and guide the user in a calm and easy to understand manner.

        You can use tools, perform actions, or fetch information when needed.
        Only use tools when it clearly helps the user, and explain the result in simple language.

        Keep responses concise unless the user asks for depth.
        If the user's request is unclear, ask for clarification in a straightforward way.
        Always remain polite, steady, and supportive.
    """
    
    @classmethod
    def from_dict(cls, config_dict: dict) -> 'ConsoleConfig':
        """Create config from dictionary."""
        return cls(**{k: v for k, v in config_dict.items() if hasattr(cls, k)})
    
    def to_dict(self) -> dict:
        """Convert config to dictionary."""
        return {
            'ai_provider': self.ai_provider,
            'ai_model': self.ai_model,
            'ai_project_id': self.ai_project_id,
            'ai_location': self.ai_location,
            'voice_language': self.voice_language,
            'voice_name': self.voice_name,
            'command_prefix': self.command_prefix,
            'max_history_size': self.max_history_size,
            'show_timestamps': self.show_timestamps,
            'enable_voice_output': self.enable_voice_output,
            'max_tokens': self.max_tokens,
            'temperature': self.temperature,
            'system_instructions': self.system_instructions
        }
