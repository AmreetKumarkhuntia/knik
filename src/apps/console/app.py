"""
Console Application
Main application logic for the interactive console.
"""

import sys
import os
from typing import Optional, List, Dict, Any
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from lib import (
    AIClient,
    MockAIClient,
    KokoroVoiceModel,
    AudioProcessor,
    ConsoleProcessor,
    printer,
    Config
)
from .config import ConsoleConfig


class ConversationHistory:
    """Manages conversation history for context-aware interactions."""
    
    def __init__(self, max_size: int = 50):
        self.max_size = max_size
        self.entries: List[Dict[str, Any]] = []
    
    def add_entry(self, user_input: str, ai_response: str):
        entry = {
            'timestamp': datetime.now(),
            'user': user_input,
            'assistant': ai_response
        }
        self.entries.append(entry)
        
        if len(self.entries) > self.max_size:
            self.entries = self.entries[-self.max_size:]
    
    def get_context(self, last_n: int = 5) -> str:
        """Get conversation context for AI query."""
        if not self.entries:
            return ""
        
        context_entries = self.entries[-last_n:]
        context_parts = []
        
        for entry in context_entries:
            context_parts.append(f"User: {entry['user']}")
            context_parts.append(f"Assistant: {entry['assistant']}")
        
        return "\n".join(context_parts)
    
    def get_all_entries(self) -> List[Dict[str, Any]]:
        return self.entries.copy()
    
    def clear(self):
        self.entries.clear()


class ConsoleApp:
    def __init__(self, config: Optional[ConsoleConfig] = None):
        self.config = config or ConsoleConfig()
        self.ai_client: Optional[AIClient] = None
        self.voice_model: Optional[KokoroVoiceModel] = None
        self.audio_processor: Optional[AudioProcessor] = None
        self.console_processor: Optional[ConsoleProcessor] = None
        self.history = ConversationHistory(max_size=self.config.max_history_size)
        self.running = False
    
    def initialize(self) -> bool:
        try:
            printer.info("Initializing console application...")
            
            if self.config.ai_provider == "vertex":
                self.ai_client = AIClient(
                    provider="vertex",
                    project_id=self.config.ai_project_id,
                    location=self.config.ai_location,
                    model_name=self.config.ai_model
                )
            else:
                self.ai_client = MockAIClient()
            
            if not self.ai_client.is_configured():
                printer.error("AI client is not properly configured!")
                printer.warning("For Vertex AI, set GOOGLE_CLOUD_PROJECT environment variable")
                printer.info("Falling back to Mock AI for demo purposes...")
                self.ai_client = MockAIClient()
            
            self.voice_model = KokoroVoiceModel(
                language=self.config.voice_language,
                voice=self.config.voice_name
            )
            
            self.audio_processor = AudioProcessor()
            
            self.console_processor = ConsoleProcessor(
                command_prefix=self.config.command_prefix
            )
            
            self._register_commands()
            
            printer.success("✓ All components initialized successfully")
            return True
            
        except Exception as e:
            printer.error(f"Failed to initialize: {e}")
            return False
    
    def _register_commands(self):
        self.console_processor.register_command("exit", self._cmd_exit)
        self.console_processor.register_command("quit", self._cmd_exit)
        self.console_processor.register_command("help", self._cmd_help)
        self.console_processor.register_command("clear", self._cmd_clear)
        self.console_processor.register_command("history", self._cmd_history)
        self.console_processor.register_command("voice", self._cmd_voice)
        self.console_processor.register_command("info", self._cmd_info)
        self.console_processor.register_command("toggle-voice", self._cmd_toggle_voice)
    
    def _cmd_exit(self, args: str) -> str:
        """Exit command handler."""
        self.running = False
        return "Goodbye! 👋"
    
    def _cmd_help(self, args: str) -> str:
        """Help command handler."""
        help_text = f"""
Available Commands:
  {self.config.command_prefix}help          - Show this help message
  {self.config.command_prefix}exit/quit     - Exit the application
  {self.config.command_prefix}clear         - Clear conversation history
  {self.config.command_prefix}history       - Show conversation history
  {self.config.command_prefix}voice <name>  - Change voice (e.g., af_sarah, am_adam)
  {self.config.command_prefix}info          - Show current configuration
  {self.config.command_prefix}toggle-voice  - Enable/disable voice output

Just type your question to chat with AI!
"""
        return help_text.strip()
    
    def _cmd_clear(self, args: str) -> str:
        self.history.clear()
        return "Conversation history cleared! 🗑️"
    
    def _cmd_history(self, args: str) -> str:
        entries = self.history.get_all_entries()
        if not entries:
            return "No conversation history yet."
        
        history_lines = ["\n📜 Conversation History:"]
        for i, entry in enumerate(entries, 1):
            timestamp = entry['timestamp'].strftime("%H:%M:%S")
            history_lines.append(f"\n[{i}] {timestamp}")
            history_lines.append(f"  You: {entry['user']}")
            history_lines.append(f"  AI:  {entry['assistant'][:100]}...")
        
        return "\n".join(history_lines)
    
    def _cmd_voice(self, args: str) -> str:
        if not args:
            return f"Current voice: {self.config.voice_name}\nUsage: {self.config.command_prefix}voice <name>"
        
        try:
            self.voice_model = KokoroVoiceModel(
                language=self.config.voice_language,
                voice=args.strip()
            )
            self.config.voice_name = args.strip()
            return f"Voice changed to: {args.strip()} 🎙️"
        except Exception as e:
            return f"Failed to change voice: {e}"
    
    def _cmd_info(self, args: str) -> str:
        ai_info = self.ai_client.get_info()
        voice_info = self.voice_model.get_info()
        
        info_text = f"""
Current Configuration:
  AI Provider:    {ai_info.get('provider', 'Unknown')}
  AI Model:       {ai_info.get('model', 'Unknown')}
  Voice:          {voice_info.get('voice', 'Unknown')}
  Voice Output:   {'Enabled' if self.config.enable_voice_output else 'Disabled'}
  History Size:   {len(self.history.entries)}/{self.config.max_history_size}
"""
        return info_text.strip()
    
    def _cmd_toggle_voice(self, args: str) -> str:
        self.config.enable_voice_output = not self.config.enable_voice_output
        status = "enabled" if self.config.enable_voice_output else "disabled"
        return f"Voice output {status} 🔊"
    
    def process_user_input(self, user_input: str) -> Optional[str]:
        if user_input.startswith(self.config.command_prefix):
            return self.console_processor.process_inline(user_input)
        
        try:
            printer.info("🤔 Thinking...")
            
            context = self.history.get_context(last_n=3)
            max_tokens = self.config.max_tokens
            temperature = self.config.temperature
            system_instructions = self.config.system_instructions

            if context:
                full_prompt = f"Previous conversation:\n{context}\n\nCurrent question: {user_input}"
            else:
                full_prompt = user_input
            
            response = self.ai_client.query(full_prompt, max_tokens, temperature, system_instructions)
            self.history.add_entry(user_input, response)
            
            return response
            
        except Exception as e:
            printer.error(f"Error querying AI: {e}")
            return f"Sorry, I encountered an error: {e}"
    
    def play_voice_response(self, text: str):
        if not self.config.enable_voice_output:
            return
        
        try:
            printer.info("🎙️ Generating voice...")
            # Use synthesize() instead of generate() to avoid pauses between paragraphs
            audio, sample_rate = self.voice_model.synthesize(text)
            self.audio_processor.play(audio, blocking=True)
            printer.success("Voice playback complete")
        except Exception as e:
            printer.error(f"Voice playback error: {e}")
    
    def run(self):
        if not self.initialize():
            printer.error("Failed to start application")
            return
        
        # Display welcome message
        print("\n" + "="*60)
        print(self.config.welcome_message)
        print("="*60)
        print(f"\nType '{self.config.command_prefix}help' for available commands")
        print(f"Type '{self.config.command_prefix}exit' to quit\n")
        
        self.running = True
        
        try:
            while self.running:
                try:
                    user_input = input(f"\n{self.config.prompt_symbol}").strip()
                    
                    if not user_input:
                        continue
                    
                    printer.info(f"User query: {user_input}")
                    
                    response = self.process_user_input(user_input)
                    
                    if response:
                        print(f"\n{self.config.assistant_symbol}{response}")
                        printer.success(f"AI response generated ({len(response)} chars)")
                        
                        if self.config.enable_voice_output and not user_input.startswith(self.config.command_prefix):
                            self.play_voice_response(response)
                
                except KeyboardInterrupt:
                    print("\n")
                    printer.warning("Interrupted by user")
                    break
                except EOFError:
                    print("\n")
                    break
                except Exception as e:
                    printer.error(f"Error in main loop: {e}")
                    continue
        
        finally:
            self.handle_exit()
    
    def handle_exit(self):
        printer.info("Shutting down console application...")
        printer.success("Thanks for using Knik Console! 👋")
