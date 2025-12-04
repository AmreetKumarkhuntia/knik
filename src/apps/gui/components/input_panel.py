"""Input panel component for user text entry."""

from collections.abc import Callable

import customtkinter as ctk


class InputPanel(ctk.CTkFrame):
    """Input panel with text entry and send button."""

    def __init__(self, master, on_send: Callable[[str], None] | None = None, **kwargs):
        super().__init__(master, **kwargs)

        self.on_send = on_send
        self.is_processing = False
        self.grid_columnconfigure(0, weight=1)

        self.text_entry = ctk.CTkEntry(
            self, placeholder_text="Type your message here...", height=40, font=ctk.CTkFont(size=14)
        )
        self.text_entry.grid(row=0, column=0, sticky="ew", padx=(10, 5), pady=10)
        self.text_entry.bind("<Return>", self._on_enter_pressed)

        self.send_button = ctk.CTkButton(
            self, text="Send", width=100, height=40, command=self._handle_send, font=ctk.CTkFont(size=14, weight="bold")
        )
        self.send_button.grid(row=0, column=1, padx=(5, 10), pady=10)

        self.voice_button = ctk.CTkButton(
            self, text="🎤", width=50, height=40, command=self._handle_voice, font=ctk.CTkFont(size=18)
        )
        self.voice_button.grid(row=0, column=2, padx=(0, 10), pady=10)

    def _on_enter_pressed(self, event):
        """Handle Enter key press."""
        self._handle_send()
        return "break"

    def _handle_send(self):
        """Handle send button click."""
        if self.is_processing:
            return

        text = self.text_entry.get().strip()
        if not text:
            return

        self.text_entry.delete(0, "end")

        if self.on_send:
            self.on_send(text)

    def _handle_voice(self):
        """Handle voice button click (placeholder for STT)."""
        # TODO: Implement STT in Phase 2
        print("Voice input not yet implemented")

    def set_processing(self, processing: bool):
        """Enable/disable input during processing."""
        self.is_processing = processing
        if processing:
            self.send_button.configure(state="disabled", text="...")
            self.text_entry.configure(state="disabled")
        else:
            self.send_button.configure(state="normal", text="Send")
            self.text_entry.configure(state="normal")
            self.text_entry.focus()

    def focus_input(self):
        """Focus the text entry."""
        self.text_entry.focus()
