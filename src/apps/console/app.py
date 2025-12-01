"""
Console Application
Main application logic for the interactive console.
"""

import time
from typing import Optional, List, Dict, Any
from datetime import datetime

from imports import AIClient, ConsoleProcessor, printer, TTSAsyncProcessor

try:
    from .config import ConsoleConfig
except ImportError:
    from apps.console.config import ConsoleConfig

from lib.mcp import register_all_tools, get_tool_info
from lib.services.ai_client.registry import MCPServerRegistry


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
        self.tts_processor: Optional[TTSAsyncProcessor] = None
        self.console_processor: Optional[ConsoleProcessor] = None
        self.history = ConversationHistory(max_size=self.config.max_history_size)
        self.running = False
    
    def initialize(self) -> bool:
        try:
            printer.info("Initializing console application...")
            
            self._initialize_ai_client()
            self._initialize_tts_processor()
            self._initialize_console_processor()
            
            printer.success("✓ All components initialized successfully")
            return True
            
        except Exception as e:
            printer.error(f"Failed to initialize: {e}")
            return False
    
    def _initialize_ai_client(self):
        tools_registered = register_all_tools(MCPServerRegistry)
        if tools_registered > 0:
            printer.success(f"✓ Registered {tools_registered} MCP tools to registry")
        
        self.ai_client = AIClient(
            provider=self.config.ai_provider,
            mcp_registry=MCPServerRegistry,
            system_instruction=self.config.system_instruction,
            project_id=self.config.ai_project_id,
            location=self.config.ai_location,
            model_name=self.config.ai_model
        )
    
    def _initialize_tts_processor(self):
        self.tts_processor = TTSAsyncProcessor(
            sample_rate=self.config.sample_rate,
            voice_model=self.config.voice_name,
            play_voice=self.config.enable_voice_output,
        )
        self.tts_processor.start_async_processing()
    
    def _initialize_console_processor(self):
        self.console_processor = ConsoleProcessor(
            command_prefix=self.config.command_prefix
        )
        self._register_commands()
    
    def _register_commands(self):
        self.console_processor.register_command("exit", self._cmd_exit)
        self.console_processor.register_command("quit", self._cmd_exit)
        self.console_processor.register_command("help", self._cmd_help)
        self.console_processor.register_command("clear", self._cmd_clear)
        self.console_processor.register_command("history", self._cmd_history)
        self.console_processor.register_command("voice", self._cmd_voice)
        self.console_processor.register_command("info", self._cmd_info)
        self.console_processor.register_command("toggle-voice", self._cmd_toggle_voice)
        self.console_processor.register_command("tools", self._cmd_tools)
    
    def _cmd_exit(self, args: str) -> str:
        self.running = False
        return "Goodbye! 👋"
    
    def _cmd_help(self, args: str) -> str:
        help_text = f"""
Available Commands:
  {self.config.command_prefix}help          - Show this help message
  {self.config.command_prefix}exit/quit     - Exit the application
  {self.config.command_prefix}clear         - Clear conversation history
  {self.config.command_prefix}history       - Show conversation history
  {self.config.command_prefix}voice <name>  - Change voice (e.g., af_sarah, am_adam)
  {self.config.command_prefix}info          - Show current configuration
  {self.config.command_prefix}toggle-voice  - Enable/disable voice output
  {self.config.command_prefix}tools         - Show available MCP tools

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
            if self.tts_processor:
                self.tts_processor.set_voice(args.strip())
                self.config.voice_name = args.strip()
            return f"Voice changed to: {args.strip()} 🎙️"
        except Exception as e:
            return f"Failed to change voice: {e}"
    
    def _cmd_info(self, args: str) -> str:
        ai_info = self.ai_client.get_info()
        voice_status = 'Enabled' if self.config.enable_voice_output else 'Disabled'
        
        return f"""Current Configuration:
            AI Provider:    {ai_info.get('provider', 'Unknown')}
            AI Model:       {ai_info.get('model', 'Unknown')}
            Voice:          {self.config.voice_name}
            Voice Output:   {voice_status}
            History Size:   {len(self.history.entries)}/{self.config.max_history_size}"""
    
    def _cmd_toggle_voice(self, args: str) -> str:
        self.config.enable_voice_output = not self.config.enable_voice_output
        status = "enabled" if self.config.enable_voice_output else "disabled"
        return f"Voice output {status} 🔊"
    
    def _cmd_tools(self, args: str) -> str:
        """Show available MCP tools."""
        tool_info = get_tool_info()
        
        tools_text = [f"\n🛠️  Available MCP Tools ({tool_info['total_tools']} tools):\n"]
        
        for tool in tool_info['tools']:
            tools_text.append(f"  • {tool['name']}")
            tools_text.append(f"    {tool['description']}")
            tools_text.append("")
        
        return "\n".join(tools_text)
    
    def _build_prompt(self, user_input: str) -> str:
        context = self.history.get_context(last_n=3)
        if context:
            return f"Previous conversation:\n{context}\n\nCurrent question: {user_input}"
        return user_input
    
    def _stream_response(self, user_input: str):
        printer.info("🤔 Thinking...")
        
        full_prompt = self._build_prompt(user_input)
        response_stream = self.ai_client.query_stream(
            prompt=full_prompt,
            use_tools=True,
            max_tokens=self.config.max_tokens, 
            temperature=self.config.temperature
        )
        
        full_response = []
        for chunk in response_stream:
            full_response.append(chunk)
            yield chunk
        
        self.history.add_entry(user_input, "".join(full_response))
    
    def _enqueue_voice(self, text: str):
        if self.config.enable_voice_output and self.tts_processor and text.strip():
            try:
                self.tts_processor.play_async(text)
            except Exception as e:
                printer.error(f"Voice generation error: {e}")
    
    def wait_until(self, condition_fn, timeout: Optional[float] = None, check_interval: float = 2) -> bool:
        start_time = time.time()
        
        while not condition_fn():
            if timeout is not None and (time.time() - start_time) >= timeout:
                printer.warning("timing out of wait ...")
                return False
            time.sleep(check_interval)
        
        return True
    
    def _handle_user_input(self, user_input: str):
        if user_input.startswith(self.config.command_prefix):
            response = self.console_processor.process_inline(user_input)
            if response:
                print(f"{self.config.assistant_symbol}{response}\n")
            return
        
        print(f"\n{self.config.assistant_symbol}", end="", flush=True)
        
        chunk_count = 0
        first_chunk = True
        
        full_ai_response = []
        try:
            for chunk in self._stream_response(user_input):
                print(chunk, end="", flush=True)
                full_ai_response.append(chunk)
                chunk_count += 1
                
                if first_chunk and self.config.enable_voice_output:
                    printer.info("🎙️ Starting voice generation...")
                    first_chunk = False
                
                self._enqueue_voice(chunk)
            
            print("\n")
            
            if full_ai_response:
                full_response_text = ''.join(full_ai_response)
                printer.info(f"AI response: {full_response_text}")
            
            status = f"Streaming complete! ({chunk_count} chunks)"
            printer.success(status)
            
            if self.config.enable_voice_output and self.tts_processor:
                printer.info("Waiting for audio playback to complete...")
                self.wait_until(
                    condition_fn=lambda: self.tts_processor.is_processing_complete(),
                    timeout=ConsoleConfig.loop_check_timeout,
                    check_interval=ConsoleConfig.loop_check_interval
                )
                printer.success("Audio playback complete!")
            
        except Exception as e:
            printer.error(f"Error: {e}")
    
    def _display_welcome(self):
        print("\n" + "="*60)
        print(self.config.welcome_message)
        print("="*60)
        print(f"\nType '{self.config.command_prefix}help' for available commands")
        print(f"Type '{self.config.command_prefix}exit' to quit\n")
    
    def run(self):
        if not self.initialize():
            printer.error("Failed to start application")
            return
        
        self._display_welcome()
        self.running = True
        
        try:
            while self.running:
                try:
                    print(f"{self.config.prompt_symbol}", end="", flush=True)
                    user_input = input().strip()
                    
                    if not user_input:
                        continue
                    
                    printer.info(f"User query: {user_input}")
                    self._handle_user_input(user_input)
                
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
            self._shutdown()
    
    def _shutdown(self):
        printer.info("Shutting down console application...")
        printer.success("Thanks for using Knik Console! 👋")


if __name__ == "__main__":
    config = ConsoleConfig()
    app = ConsoleApp(config)
    app.run()
