"""Main GUI application - JARVIS-like AI Assistant."""

import time
import customtkinter as ctk
from typing import Optional
import threading

from imports import AIClient, TTSAsyncProcessor, printer

try:
    from .config import GUIConfig
    from .components.chat_panel import ChatPanel
    from .components.input_panel import InputPanel
    from .components.settings_panel import SettingsPanel
except ImportError:
    from apps.gui.config import GUIConfig
    from apps.gui.components.chat_panel import ChatPanel
    from apps.gui.components.input_panel import InputPanel
    from apps.gui.components.settings_panel import SettingsPanel

from lib.mcp import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry
from apps.console.history import ConversationHistory


class GUIApp:
    """Main GUI Application for Knik AI Assistant."""
    
    def __init__(self, config: Optional[GUIConfig] = None):
        self.config = config or GUIConfig()
        self.ai_client: Optional[AIClient] = None
        self.tts_processor: Optional[TTSAsyncProcessor] = None
        self.history = ConversationHistory(max_size=self.config.max_history_size)
        self.is_processing = False
        
        ctk.set_appearance_mode(self.config.appearance_mode)
        ctk.set_default_color_theme(self.config.color_theme)
        
        self.root = ctk.CTk()
        self.root.title(self.config.window_title)
        self.root.geometry(f"{self.config.window_width}x{self.config.window_height}")
        self.root.minsize(self.config.min_width, self.config.min_height)
        self.root.grid_rowconfigure(1, weight=1)
        self.root.grid_columnconfigure(0, weight=1)
        
        self._create_widgets()
        self._initialize_backend()
        
    def _create_widgets(self):
        """Create all GUI widgets."""
        top_bar = ctk.CTkFrame(self.root, height=60, corner_radius=0)
        top_bar.grid(row=0, column=0, sticky="ew", padx=0, pady=0)
        top_bar.grid_columnconfigure(0, weight=1)
        top_bar.grid_propagate(False)
        
        title_label = ctk.CTkLabel(
            top_bar,
            text="🤖 Knik AI Assistant",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.grid(row=0, column=0, padx=20, pady=10, sticky="w")
        
        self.settings_button = ctk.CTkButton(
            top_bar,
            text="⚙️ Settings",
            width=120,
            command=self._open_settings,
            font=ctk.CTkFont(size=14)
        )
        self.settings_button.grid(row=0, column=1, padx=10, pady=10)
        
        self.clear_button = ctk.CTkButton(
            top_bar,
            text="🗑️ Clear",
            width=100,
            command=self._clear_chat,
            font=ctk.CTkFont(size=14),
            fg_color="gray40",
            hover_color="gray50"
        )
        self.clear_button.grid(row=0, column=2, padx=10, pady=10)
        
        self.status_label = ctk.CTkLabel(
            top_bar,
            text="● Ready",
            font=ctk.CTkFont(size=12),
            text_color="green"
        )
        self.status_label.grid(row=0, column=3, padx=20, pady=10)
        
        self.chat_panel = ChatPanel(self.root, corner_radius=0)
        self.chat_panel.grid(row=1, column=0, sticky="nsew", padx=0, pady=0)
        
        self.input_panel = InputPanel(
            self.root,
            on_send=self._handle_user_input,
            height=80
        )
        self.input_panel.grid(row=2, column=0, sticky="ew", padx=0, pady=0)
        
        self._show_welcome_message()
        
    def _show_welcome_message(self):
        """Show initial welcome message."""
        welcome = """Welcome to Knik AI Assistant! 👋

I'm your intelligent AI assistant, powered by advanced language models and voice synthesis.

**Features:**
• Natural conversation with context awareness
• Voice responses (can be toggled in settings)
• 20+ built-in tools for calculations, file operations, shell commands, and more
• Dynamic provider and model switching

**Quick Tips:**
• Just type your question or command and press Enter
• Click ⚙️ Settings to configure AI provider, voice, and appearance
• Use 🎤 button for voice input (coming soon in Phase 2)

How can I help you today?"""
        
        self.chat_panel.add_assistant_message(welcome)
        
    def _initialize_backend(self):
        """Initialize AI client and TTS processor."""
        try:
            printer.info("Initializing backend services...")
            
            tools_registered = register_all_tools(MCPServerRegistry)
            if tools_registered > 0:
                printer.success(f"✓ Registered {tools_registered} MCP tools")
            
            self.ai_client = AIClient(
                provider=self.config.ai_provider,
                mcp_registry=MCPServerRegistry,
                system_instruction=self.config.system_instruction,
                tool_callback=self._on_tool_executed,
                project_id=self.config.ai_project_id,
                location=self.config.ai_location,
                model_name=self.config.ai_model
            )
            printer.success("✓ AI Client initialized")
            
            self.tts_processor = TTSAsyncProcessor(
                sample_rate=self.config.sample_rate,
                voice_model=self.config.voice_name,
                play_voice=self.config.enable_voice_output,
            )
            self.tts_processor.start_async_processing()
            printer.success("✓ TTS Processor initialized")
            
            self._update_status("Ready", "green")
            
        except Exception as e:
            printer.error(f"Failed to initialize backend: {e}")
            self._update_status("Error", "red")
            
    def _handle_user_input(self, user_input: str):
        """Handle user input and get AI response."""
        if self.is_processing:
            return
            
        if not user_input.strip():
            return
            
        self.chat_panel.add_user_message(user_input)
        
        self.input_panel.set_processing(True)
        self.is_processing = True
        self._update_status("Thinking...", "orange")
        
        thread = threading.Thread(
            target=self._process_ai_response,
            args=(user_input,),
            daemon=True
        )
        thread.start()
        
    def _process_ai_response(self, user_input: str):
        """Process AI response in background thread."""
        try:
            printer.info(f"User query: {user_input}")
            
            full_response = []
            response_started = False
            
            for chunk in self.ai_client.chat_with_agent_stream(
                prompt=user_input,
                use_tools=True,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature
            ):
                full_response.append(chunk)
                
                if not response_started:
                    self._update_status("Speaking...", "blue")
                    response_started = True
                
                if self.config.enable_voice_output and self.tts_processor:
                    self.tts_processor.play_async(chunk)
            
            complete_response = "".join(full_response)
            self.root.after(0, self.chat_panel.add_assistant_message, complete_response)
            self.history.add_entry(user_input, complete_response)
            
            printer.success("AI response complete")
            
            # Wait for voice to complete
            if self.config.enable_voice_output and self.tts_processor:
                while not self.tts_processor.is_processing_complete():
                    time.sleep(0.1)
                printer.success("Voice playback complete")
            
        except Exception as e:
            printer.error(f"Error processing response: {e}")
            error_msg = f"Error: {str(e)}"
            self.root.after(0, self.chat_panel.add_assistant_message, error_msg)
        finally:
            self.root.after(0, self._finish_processing)
            
    def _finish_processing(self):
        """Finish processing and re-enable input."""
        self.input_panel.set_processing(False)
        self.is_processing = False
        self._update_status("Ready", "green")
        self.input_panel.focus_input()
        
    def _update_status(self, text: str, color: str):
        """Update status label."""
        self.status_label.configure(text=f"● {text}", text_color=color)
    
    def _on_tool_executed(self, tool_name: str, tool_args: dict):
        """Callback when a tool is executed - display in chat."""
        if tool_name == "run_shell_command":
            command = tool_args.get("command", "unknown")
            message = f"🔧 Executing: `{command}`"
        else:
            args_str = ", ".join(f"{k}={v}" for k, v in list(tool_args.items())[:2])
            message = f"🔧 Using tool: {tool_name}({args_str}...)"
        
        # Display in GUI (thread-safe)
        self.root.after(0, self.chat_panel.add_system_message, message)
        
    def _clear_chat(self):
        """Clear chat history."""
        self.chat_panel.clear_chat()
        self.history = ConversationHistory(max_size=self.config.max_history_size)
        self._show_welcome_message()
        printer.info("Chat cleared")
        
    def _open_settings(self):
        """Open settings window."""
        SettingsPanel(self.root, self.config, on_save=self._on_settings_saved)
        
    def _on_settings_saved(self, config: GUIConfig):
        """Handle settings saved."""
        printer.info("Settings saved, reinitializing backend...")
        self.config = config
        
        self.ai_client = AIClient(
            provider=self.config.ai_provider,
            mcp_registry=MCPServerRegistry,
            system_instruction=self.config.system_instruction,
            project_id=self.config.ai_project_id,
            location=self.config.ai_location,
            model_name=self.config.ai_model
        )
        
        if self.tts_processor:
            self.tts_processor.play_voice = self.config.enable_voice_output
            
        printer.success("Settings applied")
        self.chat_panel.add_assistant_message(
            f"Settings updated! Provider: {self.config.ai_provider}, "
            f"Model: {self.config.ai_model}, Voice: {self.config.voice_name}"
        )
        
    def run(self):
        """Run the application."""
        printer.info("Starting GUI application...")
        self.input_panel.focus_input()
        self.root.mainloop()
        
    def shutdown(self):
        """Cleanup and shutdown."""
        printer.info("Shutting down GUI application...")
        printer.success("Goodbye! 👋")


def main():
    """Main entry point."""
    config = GUIConfig()
    app = GUIApp(config)
    
    try:
        app.run()
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    finally:
        app.shutdown()


if __name__ == "__main__":
    main()
