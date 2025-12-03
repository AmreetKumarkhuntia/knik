import time
from typing import Optional

from imports import AIClient, ConsoleProcessor, printer, TTSAsyncProcessor

try:
    from .config import ConsoleConfig
    from .history import ConversationHistory
except ImportError:
    from apps.console.config import ConsoleConfig
    from apps.console.history import ConversationHistory

from lib.mcp import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry

try:
    from .tools import register_commands
except ImportError:
    from apps.console.tools import register_commands


class ConsoleApp:
    def __init__(self, config: Optional[ConsoleConfig] = None):
        self.config = config or ConsoleConfig()
        self.ai_client: Optional[AIClient] = None
        self.tts_processor: Optional[TTSAsyncProcessor] = None
        self.console_processor: Optional[ConsoleProcessor] = None
        self.history = ConversationHistory(max_size=self.config.max_history_size)
        self.running = False
        self.debug_mode = False
    
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
        commands_count = register_commands(self, self.console_processor)
        printer.info(f"✓ Registered {commands_count} console commands")
    
    def _build_prompt(self, user_input: str) -> str:
        context = self.history.get_context(last_n=3)
        if context:
            return f"Previous conversation:\n{context}\n\nCurrent question: {user_input}"
        return user_input
    
    def _stream_response(self, user_input: str):
        printer.info("🤔 Thinking...")
        
        response_stream = self.ai_client.chat_with_agent_stream(
            prompt=user_input,
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
            if self.debug_mode:
                print(f"🐛 [DEBUG] Executing command: {user_input}")
            response = self.console_processor.process_inline(user_input)
            if response:
                print(f"{self.config.assistant_symbol}{response}\n")
            return
        
        if self.debug_mode:
            print(f"🐛 [DEBUG] Processing input: {user_input[:50]}...")
            print(f"🐛 [DEBUG] Querying AI with provider: {self.ai_client.provider_name}")
        
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
                    if self.debug_mode:
                        print("\n🐛 [DEBUG] Starting voice generation...")
                    printer.info("🎙️ Starting voice generation...")
                    first_chunk = False
                
                self._enqueue_voice(chunk)
            
            print("\n")
            
            if full_ai_response:
                full_response_text = ''.join(full_ai_response)
                printer.info(f"AI response: {full_response_text}")
                
                if self.debug_mode:
                    word_count = len(full_response_text.split())
                    char_count = len(full_response_text)
                    print(f"🐛 [DEBUG] Response stats: {word_count} words, {char_count} chars")
            else:
                if self.debug_mode:
                    print("🐛 [DEBUG] No response received from AI!")
            
            if self.debug_mode:
                print(f"🐛 [DEBUG] Streaming complete! ({chunk_count} chunks)")
            
            status = f"Streaming complete! ({chunk_count} chunks)"
            printer.success(status)
            
            if self.config.enable_voice_output and self.tts_processor:
                if self.debug_mode:
                    print("🐛 [DEBUG] Waiting for audio playback to complete...")
                printer.info("Waiting for audio playback to complete...")
                self.wait_until(
                    condition_fn=lambda: self.tts_processor.is_processing_complete(),
                    timeout=ConsoleConfig.loop_check_timeout,
                    check_interval=ConsoleConfig.loop_check_interval
                )
                if self.debug_mode:
                    print("🐛 [DEBUG] Audio playback complete!")
                printer.success("Audio playback complete!")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            printer.error(f"Error: {e}")
            if self.debug_mode:
                import traceback
                print(f"🐛 [DEBUG] Traceback:\n{traceback.format_exc()}")
    
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
