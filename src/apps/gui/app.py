"""Main GUI application - JARVIS-like AI Assistant."""

import threading
import time

import customtkinter as ctk

from imports import AIClient, TTSAsyncProcessor, printer


try:
    from .components.chat_panel import ChatPanel
    from .components.gradient_background import GradientBackground
    from .components.input_panel import InputPanel
    from .components.settings_panel import SettingsPanel
    from .config import GUIConfig
    from .theme import ColorTheme, Fonts, Spacing
except ImportError:
    from apps.gui.components.chat_panel import ChatPanel
    from apps.gui.components.gradient_background import GradientBackground
    from apps.gui.components.input_panel import InputPanel
    from apps.gui.components.settings_panel import SettingsPanel
    from apps.gui.config import GUIConfig
    from apps.gui.theme import ColorTheme, Fonts, Spacing

from apps.console.history import ConversationHistory
from lib.mcp import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry


class GUIApp:
    """Main GUI Application for Knik AI Assistant."""

    def __init__(self, config: GUIConfig | None = None):
        self.config = config or GUIConfig()
        self.ai_client: AIClient | None = None
        self.tts_processor: TTSAsyncProcessor | None = None
        self.history = ConversationHistory(max_size=self.config.max_history_size)
        self.is_processing = False

        ctk.set_appearance_mode(self.config.appearance_mode)
        ctk.set_default_color_theme(self.config.color_theme)
        ColorTheme.set_mode(self.config.appearance_mode)

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
        # Animated gradient background (lowest layer)
        self.gradient_bg = GradientBackground(
            self.root, colors=ColorTheme.GRADIENT_COLORS, transition_speed=8000, fps=30
        )
        self.gradient_bg.place(x=0, y=0, relwidth=1, relheight=1)

        # Modern gradient-style top bar
        self.top_bar = ctk.CTkFrame(
            self.root, height=Spacing.TOPBAR_HEIGHT, corner_radius=0, fg_color=ColorTheme.BG_SECONDARY
        )
        self.top_bar.grid(row=0, column=0, sticky="ew", padx=0, pady=0)
        self.top_bar.grid_columnconfigure(0, weight=1)
        self.top_bar.grid_propagate(False)

        self.title_label = ctk.CTkLabel(
            self.top_bar,
            text="Knik AI Assistant",
            font=ctk.CTkFont(**Fonts.title()),
            text_color=ColorTheme.TEXT_PRIMARY,
        )
        self.title_label.grid(row=0, column=0, padx=Spacing.PAD_XLARGE, pady=Spacing.MARGIN_MEDIUM, sticky="w")

        self.settings_button = ctk.CTkButton(
            self.top_bar,
            text="Settings",
            width=130,
            height=40,
            command=self._open_settings,
            font=ctk.CTkFont(size=14, weight="normal"),
            fg_color=ColorTheme.BTN_SECONDARY,
            hover_color=ColorTheme.BTN_SECONDARY_HOVER,
            text_color=ColorTheme.TEXT_PRIMARY,
            corner_radius=ColorTheme.RADIUS_SMALL,
        )
        self.settings_button.grid(row=0, column=1, padx=Spacing.PAD_SMALL, pady=Spacing.MARGIN_MEDIUM)

        self.clear_button = ctk.CTkButton(
            self.top_bar,
            text="Clear",
            width=110,
            height=40,
            command=self._clear_chat,
            font=ctk.CTkFont(size=14, weight="normal"),
            fg_color=ColorTheme.BTN_SECONDARY,
            hover_color=ColorTheme.BTN_SECONDARY_HOVER,
            text_color=ColorTheme.TEXT_PRIMARY,
            corner_radius=ColorTheme.RADIUS_SMALL,
        )
        self.clear_button.grid(row=0, column=2, padx=Spacing.PAD_SMALL, pady=Spacing.MARGIN_MEDIUM)

        self.status_label = ctk.CTkLabel(
            self.top_bar, text="● Ready", font=ctk.CTkFont(size=13), text_color=ColorTheme.STATUS_SUCCESS
        )
        self.status_label.grid(row=0, column=3, padx=Spacing.PAD_XLARGE, pady=Spacing.MARGIN_MEDIUM)

        # Chat panel with modern background
        self.chat_panel = ChatPanel(self.root, corner_radius=0, fg_color=ColorTheme.BG_PRIMARY)
        self.chat_panel.grid(row=1, column=0, sticky="nsew", padx=0, pady=0)

        # Input panel with modern styling
        self.input_panel = InputPanel(self.root, on_send=self._handle_user_input, height=90)
        self.input_panel.grid(row=2, column=0, sticky="ew", padx=0, pady=0)

        self._show_welcome_message()

    def _show_welcome_message(self):
        """Show initial welcome message."""
        welcome = """Welcome! I'm Knik, your AI assistant. 🚀

I can help you with:
• Answering questions with conversation memory
• File operations and system commands
• Calculations and text processing
• And much more with 20+ built-in tools!

Just type your question below and press Enter to get started."""

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
                model_name=self.config.ai_model,
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
            self._update_status("Error", ColorTheme.STATUS_ERROR)

    def _handle_user_input(self, user_input: str):
        """Handle user input and get AI response."""
        if self.is_processing:
            return

        if not user_input.strip():
            return

        self.chat_panel.add_user_message(user_input)

        self.input_panel.set_processing(True)
        self.is_processing = True
        self._update_status("Thinking...", ColorTheme.STATUS_WARNING)

        thread = threading.Thread(target=self._process_ai_response, args=(user_input,), daemon=True)
        thread.start()

    def _process_ai_response(self, user_input: str):
        """Process AI response in background thread."""
        try:
            printer.info(f"User query: {user_input}")

            # Get conversation history as message objects
            history_messages = self.history.get_messages(last_n=self.config.history_context_size)

            if history_messages:
                printer.debug(f"Including {len(history_messages)} history messages")

            full_response = []
            response_started = False

            for chunk in self.ai_client.chat_with_agent_stream(
                prompt=user_input,
                use_tools=True,
                history=history_messages,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
            ):
                full_response.append(chunk)

                if not response_started:
                    self._update_status("Speaking...", ColorTheme.STATUS_INFO)
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
        self._update_status("Ready", ColorTheme.STATUS_SUCCESS)
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

        # Update theme
        ColorTheme.set_mode(self.config.appearance_mode)
        self._refresh_theme()

        self.ai_client = AIClient(
            provider=self.config.ai_provider,
            mcp_registry=MCPServerRegistry,
            system_instruction=self.config.system_instruction,
            project_id=self.config.ai_project_id,
            location=self.config.ai_location,
            model_name=self.config.ai_model,
        )

        if self.tts_processor:
            self.tts_processor.play_voice = self.config.enable_voice_output

        printer.success("Settings applied")
        self.chat_panel.add_assistant_message(
            f"Settings updated! Provider: {self.config.ai_provider}, "
            f"Model: {self.config.ai_model}, Voice: {self.config.voice_name}"
        )

    def _refresh_theme(self):
        """Refresh UI colors after theme change."""
        printer.info(f"Refreshing theme to: {ColorTheme.get_mode()}")

        # Update gradient background with new theme colors
        if hasattr(self, "gradient_bg"):
            self.gradient_bg.update_theme(ColorTheme.GRADIENT_COLORS)

        # Update main window background
        self.root.configure(fg_color=ColorTheme.BG_PRIMARY)

        # Update top bar
        self.top_bar.configure(fg_color=ColorTheme.BG_SECONDARY)
        self.title_label.configure(text_color=ColorTheme.TEXT_PRIMARY)

        # Update top bar buttons
        self.settings_button.configure(
            fg_color=ColorTheme.BTN_SECONDARY,
            hover_color=ColorTheme.BTN_SECONDARY_HOVER,
            text_color=ColorTheme.TEXT_PRIMARY,
        )
        self.clear_button.configure(
            fg_color=ColorTheme.BTN_SECONDARY,
            hover_color=ColorTheme.BTN_SECONDARY_HOVER,
            text_color=ColorTheme.TEXT_PRIMARY,
        )

        # Update status label color
        self._update_status("Ready", ColorTheme.STATUS_SUCCESS)

        # Update chat panel background
        self.chat_panel.configure(fg_color=ColorTheme.BG_PRIMARY)

        # Update input panel colors
        self.input_panel.configure(fg_color=ColorTheme.BG_SECONDARY)
        self.input_panel.text_entry.configure(
            fg_color=ColorTheme.BG_TERTIARY,
            text_color=ColorTheme.TEXT_PRIMARY,
            placeholder_text_color=ColorTheme.TEXT_TERTIARY,
        )
        self.input_panel.send_button.configure(
            fg_color=ColorTheme.BTN_PRIMARY, hover_color=ColorTheme.BTN_PRIMARY_HOVER, text_color="white"
        )
        self.input_panel.voice_button.configure(
            fg_color=ColorTheme.BTN_SECONDARY,
            hover_color=ColorTheme.BTN_SECONDARY_HOVER,
            text_color=ColorTheme.TEXT_PRIMARY,
        )

        # Force chat panel to refresh all messages with new colors
        self.chat_panel.refresh_theme()

        printer.success("Theme refresh complete!")

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
