from dataclasses import dataclass

from lib.core.config import Config


@dataclass
class ConsoleConfig:
    """Configuration for Console application - extends core Config with console-specific settings."""

    # AI settings (from core Config)
    ai_provider: str = Config.from_env("KNIK_AI_PROVIDER", "vertex")
    ai_model: str = Config.get_ai_model()
    ai_project_id: str | None = Config.get_ai_project()
    ai_location: str = Config.get_ai_location()
    max_tokens: int = Config.from_env("KNIK_MAX_TOKENS", Config.DEFAULT_AI_MAX_TOKENS, int)
    temperature: float = Config.from_env("KNIK_TEMPERATURE", Config.DEFAULT_AI_TEMPERATURE, float)

    # TTS settings (from core Config)
    voice_language: str = Config.get_language()
    voice_name: str = Config.get_voice()
    sample_rate: int = Config.SAMPLE_RATE
    enable_voice_output: bool = Config.from_env("KNIK_VOICE_OUTPUT", True, bool)

    # Console-specific settings
    command_prefix: str = "/"
    max_history_size: int = 50
    show_timestamps: bool = False
    welcome_message: str = "🤖 Knik Console - Your AI Assistant with Voice"
    prompt_symbol: str = "You: "
    assistant_symbol: str = "AI: "
    debug_mode: bool = False
    loop_check_timeout: int = 500.0
    loop_check_interval: int = 3.0

    def __post_init__(self):
        self.system_instruction = Config.from_env("KNIK_AI_SYSTEM_INSTRUCTION", Config.DEFAULT_SYSTEM_INSTRUCTION)
