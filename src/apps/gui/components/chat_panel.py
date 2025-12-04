"""Chat panel component for displaying conversation history."""

import customtkinter as ctk


class ChatPanel(ctk.CTkScrollableFrame):
    """Scrollable chat panel showing conversation history."""

    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)

        self.messages = []
        self.message_frames = []
        self.grid_columnconfigure(0, weight=1)

    def add_user_message(self, text: str):
        """Add user message to chat."""
        self._add_message(text, is_user=True)

    def add_assistant_message(self, text: str):
        """Add assistant message to chat."""
        self._add_message(text, is_user=False)

    def add_system_message(self, text: str):
        """Add system/tool execution message to chat."""
        self._add_message(text, is_user=False, is_system=True)

    def _add_message(self, text: str, is_user: bool, is_system: bool = False):
        """Internal method to add message."""
        message_frame = ctk.CTkFrame(self, corner_radius=10)
        message_frame.grid(row=len(self.message_frames), column=0, sticky="ew", padx=10, pady=5)
        message_frame.grid_columnconfigure(0, weight=1)

        if is_system:
            prefix = "🔧 System"
            fg_color = "#4A5568"
        elif is_user:
            prefix = "You"
            fg_color = "#2B5278"
        else:
            prefix = "Knik"
            fg_color = "#1F6AA5"

        sender_label = ctk.CTkLabel(
            message_frame, text=f"{prefix}:", font=ctk.CTkFont(size=12, weight="bold"), anchor="w"
        )
        sender_label.grid(row=0, column=0, sticky="w", padx=10, pady=(10, 5))

        message_label = ctk.CTkLabel(message_frame, text=text, wraplength=900, justify="left", anchor="nw")
        message_label.grid(row=1, column=0, sticky="w", padx=10, pady=(0, 10))

        message_frame.configure(fg_color=fg_color)

        self.message_frames.append(message_frame)
        self.messages.append({"text": text, "is_user": is_user})
        self._scroll_to_bottom()

    def _scroll_to_bottom(self):
        """Scroll to the bottom of the chat."""
        self.update_idletasks()
        self._parent_canvas.yview_moveto(1.0)

    def clear_chat(self):
        """Clear all messages from chat."""
        for frame in self.message_frames:
            frame.destroy()
        self.message_frames = []
        self.messages = []

    def get_message_count(self) -> int:
        """Get number of messages in chat."""
        return len(self.messages)
