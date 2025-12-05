"""Chat panel component for displaying conversation history."""

import customtkinter as ctk

from ..animations import AnimationController, AnimationGroup, ease_in
from ..theme import ColorTheme, Fonts, Spacing


class ChatPanel(ctk.CTkScrollableFrame):
    """Scrollable chat panel showing conversation history."""

    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)

        self.messages = []
        self.message_frames = []
        self.grid_columnconfigure(0, weight=1)

        # Animation settings
        self.animations_enabled = True
        self.active_animations = AnimationGroup()

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

        # Apply animations if enabled
        if self.animations_enabled:
            # Slide-in animation for message bubble
            if is_system:
                self._animate_fade_in(message_frame)
            else:
                direction = "right" if is_user else "left"
                self._animate_slide_in(message_frame, direction)

            # Text reveal animation for message content
            # Only for non-system messages to avoid conflict with icon
            if not is_system and message_label:
                self._animate_text_reveal(message_label, text)

        self._scroll_to_bottom()

    def _animate_slide_in(self, widget, direction: str, duration: int = 350):
        """Animate widget sliding in from left or right.

        Args:
            widget: Widget to animate
            direction: "left" or "right"
            duration: Animation duration in milliseconds
        """
        # Note: Grid-based animation with negative padding causes errors in CustomTkinter
        # Instead, we'll use a subtle scale/opacity effect by modifying the widget state
        # The text reveal animation provides the primary visual feedback

        # For a future enhancement, we could:
        # 1. Use place() geometry manager instead of grid()
        # 2. Implement canvas-based rendering with true opacity
        # 3. Use CTkCanvas to draw custom animated frames

        # For now, skip the slide animation to prevent errors
        # The word-by-word text reveal provides sufficient animation feedback
        pass

    def _animate_fade_in(self, widget, duration: int = 200):
        """Animate widget fading in (for system messages).

        Args:
            widget: Widget to animate
            duration: Animation duration in milliseconds
        """
        # Note: CustomTkinter doesn't support widget-level opacity
        # We'll simulate with a quick scale animation instead

        def update(progress: float):
            # Scale from 0.95 to 1.0 for subtle effect (visual placeholder)
            # We can't actually scale in CTk, so we'll just use the animation timing
            # The widget will appear instantly but the animation provides consistency
            pass

        animation = AnimationController(
            widget=self,
            duration_ms=duration,
            update_callback=update,
            easing=ease_in,
            fps=60,
        )

        self.active_animations.add(animation)
        animation.start()

    def _animate_text_reveal(self, label: ctk.CTkLabel, text: str, word_delay: int = 40, fade_duration: int = 100):
        """Animate text revealing word by word.

        Args:
            label: Label widget to animate
            text: Full text to reveal
            word_delay: Delay between words in milliseconds
            fade_duration: Duration for each word fade in milliseconds
        """
        words = text.split()
        if not words:
            return

        # Start with empty text
        label.configure(text="")

        # Track current word index
        animation_state = {"current_index": 0, "revealed_text": ""}

        def reveal_next_word():
            if animation_state["current_index"] >= len(words):
                return

            # Add next word
            if animation_state["revealed_text"]:
                animation_state["revealed_text"] += " "
            animation_state["revealed_text"] += words[animation_state["current_index"]]

            # Update label
            try:
                label.configure(text=animation_state["revealed_text"])
            except Exception:
                return  # Widget destroyed

            animation_state["current_index"] += 1

            # Schedule next word
            if animation_state["current_index"] < len(words):
                self.after(word_delay, reveal_next_word)

        # Start revealing words
        reveal_next_word()

    def set_animations_enabled(self, enabled: bool):
        """Enable or disable animations.

        Args:
            enabled: True to enable animations, False to disable
        """
        self.animations_enabled = enabled

    def stop_all_animations(self):
        """Stop all active animations."""
        self.active_animations.stop_all()

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

        # Temporarily disable animations for instant refresh
        animations_were_enabled = self.animations_enabled
        self.animations_enabled = False

        # Clear and rebuild all messages with new theme
        for frame in self.message_frames:
            frame.destroy()
        self.message_frames = []
        self.messages = []

        # Re-add all messages with new colors
        for msg in messages_backup:
            self._add_message(msg["text"], msg["is_user"], msg.get("is_system", False))

        # Restore animation setting
        self.animations_enabled = animations_were_enabled
