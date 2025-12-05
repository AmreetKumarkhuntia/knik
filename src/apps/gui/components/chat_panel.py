"""Chat panel component for displaying conversation history."""

import customtkinter as ctk

from ..theme import ColorTheme, Fonts, Spacing


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
        # Container for message alignment
        container = ctk.CTkFrame(self, fg_color="transparent")
        container.grid(row=len(self.message_frames), column=0, sticky="ew", padx=0, pady=Spacing.MARGIN_SMALL)

        if is_system:
            # System messages centered with subtle style
            container.grid_columnconfigure(0, weight=1)
            message_frame = ctk.CTkFrame(
                container, corner_radius=ColorTheme.RADIUS_SMALL, fg_color=ColorTheme.MSG_SYSTEM_BG
            )
            message_frame.grid(row=0, column=0, padx=80, pady=2)

            message_label = ctk.CTkLabel(
                message_frame,
                text=f"🔧 {text}",
                wraplength=700,
                justify="center",
                font=ctk.CTkFont(**Fonts.badge()),
                text_color=ColorTheme.TEXT_TERTIARY,
            )
            message_label.pack(padx=Spacing.PAD_MEDIUM, pady=Spacing.MARGIN_SMALL)

        elif is_user:
            # User messages aligned right with modern bubble
            container.grid_columnconfigure(0, weight=1)
            container.grid_columnconfigure(1, weight=0)

            message_frame = ctk.CTkFrame(
                container, corner_radius=ColorTheme.RADIUS_MEDIUM, fg_color=ColorTheme.MSG_USER_BG
            )
            message_frame.grid(row=0, column=1, sticky="e", padx=Spacing.MARGIN_LARGE)

            message_label = ctk.CTkLabel(
                message_frame,
                text=text,
                wraplength=700,
                justify="left",
                font=ctk.CTkFont(**Fonts.message()),
                text_color=ColorTheme.TEXT_PRIMARY,
                anchor="w",
            )
            message_label.pack(padx=Spacing.PAD_MEDIUM, pady=Spacing.PAD_SMALL + 2)

        else:
            # AI messages aligned left with modern bubble
            container.grid_columnconfigure(0, weight=0)
            container.grid_columnconfigure(1, weight=1)

            message_frame = ctk.CTkFrame(
                container, corner_radius=ColorTheme.RADIUS_MEDIUM, fg_color=ColorTheme.MSG_AI_BG
            )
            message_frame.grid(row=0, column=0, sticky="w", padx=Spacing.MARGIN_LARGE)

            # Add AI badge
            header = ctk.CTkFrame(message_frame, fg_color="transparent")
            header.pack(fill="x", padx=Spacing.PAD_MEDIUM, pady=(Spacing.PAD_SMALL + 2, 4))

            badge = ctk.CTkLabel(
                header, text="🤖 Knik", font=ctk.CTkFont(**Fonts.badge()), text_color=ColorTheme.TEXT_ACCENT
            )
            badge.pack(anchor="w")

            message_label = ctk.CTkLabel(
                message_frame,
                text=text,
                wraplength=700,
                justify="left",
                font=ctk.CTkFont(**Fonts.message()),
                text_color=ColorTheme.TEXT_SECONDARY,
                anchor="w",
            )
            message_label.pack(padx=Spacing.PAD_MEDIUM, pady=(0, Spacing.PAD_SMALL + 2))

        self.message_frames.append(container)
        self.messages.append({"text": text, "is_user": is_user, "is_system": is_system})
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

    def refresh_theme(self):
        """Refresh all message colors after theme change."""
        # Store current messages
        messages_backup = list(self.messages)

        # Clear and rebuild all messages with new theme
        for frame in self.message_frames:
            frame.destroy()
        self.message_frames = []
        self.messages = []

        # Re-add all messages with new colors
        for msg in messages_backup:
            self._add_message(msg["text"], msg["is_user"], msg.get("is_system", False))
