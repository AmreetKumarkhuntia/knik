"""Input panel component for user text entry."""

from collections.abc import Callable

import customtkinter as ctk

from ..theme import ColorTheme, Fonts, Spacing


class InputPanel(ctk.CTkFrame):
    """Input panel with text entry and send button."""

    def __init__(self, master, on_send: Callable[[str], None] | None = None, **kwargs):
        super().__init__(master, fg_color=ColorTheme.BG_SECONDARY, **kwargs)

        self.on_send = on_send
        self.is_processing = False
        self.grid_columnconfigure(0, weight=1)

        # Modern text entry with rounded corners
        self.text_entry = ctk.CTkEntry(
            self,
            placeholder_text="Type your message here...",
            height=Spacing.INPUT_HEIGHT,
            font=ctk.CTkFont(**Fonts.input()),
            corner_radius=ColorTheme.RADIUS_LARGE,
            border_width=0,
            fg_color=ColorTheme.BG_TERTIARY,
            text_color=ColorTheme.TEXT_PRIMARY,
            placeholder_text_color=ColorTheme.TEXT_TERTIARY,
        )
        self.text_entry.grid(
            row=0, column=0, sticky="ew", padx=(Spacing.PAD_LARGE, Spacing.PAD_SMALL), pady=Spacing.MARGIN_LARGE
        )
        self.text_entry.bind("<Return>", self._on_enter_pressed)

        # Modern send button
        self.send_button = ctk.CTkButton(
            self,
            text="Send",
            width=120,
            height=Spacing.BUTTON_HEIGHT,
            command=self._handle_send,
            font=ctk.CTkFont(**Fonts.button()),
            corner_radius=ColorTheme.RADIUS_LARGE,
            fg_color=ColorTheme.BTN_PRIMARY,
            hover_color=ColorTheme.BTN_PRIMARY_HOVER,
            text_color="white",  # White text on purple button
        )
        self.send_button.grid(row=0, column=1, padx=(5, Spacing.PAD_SMALL), pady=Spacing.MARGIN_LARGE)

        # Modern voice button
        self.voice_button = ctk.CTkButton(
            self,
            text="Voice",
            width=70,
            height=Spacing.BUTTON_HEIGHT,
            command=self._handle_voice,
            font=ctk.CTkFont(size=13),
            corner_radius=ColorTheme.RADIUS_LARGE,
            fg_color=ColorTheme.BTN_SECONDARY,
            hover_color=ColorTheme.BTN_SECONDARY_HOVER,
            text_color=ColorTheme.TEXT_PRIMARY,
        )
        self.voice_button.grid(row=0, column=2, padx=(0, Spacing.PAD_LARGE), pady=Spacing.MARGIN_LARGE)

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
