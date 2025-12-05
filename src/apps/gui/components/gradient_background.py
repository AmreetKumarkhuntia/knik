"""Animated gradient background component."""

import customtkinter as ctk

from ..animations import AnimationController, interpolate_color, linear
from ..theme import ColorTheme


class GradientBackground(ctk.CTkCanvas):
    """Animated gradient background with smooth color transitions."""

    def __init__(
        self,
        master,
        colors: list[str] = None,
        transition_speed: int = 8000,
        fps: int = 30,
        **kwargs,
    ):
        """Initialize gradient background.

        Args:
            master: Parent widget
            colors: List of hex colors for gradient (default: from theme)
            transition_speed: Time in ms for full color cycle (default: 8000)
            fps: Frames per second for animation (default: 30)
            **kwargs: Additional canvas arguments
        """
        super().__init__(master, highlightthickness=0, **kwargs)

        self.colors = colors or ColorTheme.GRADIENT_COLORS.copy()
        self.transition_speed = transition_speed
        self.fps = fps

        self.current_color_index = 0
        self.animation: AnimationController = None
        self.is_animating = False

        # Store canvas size
        self.canvas_width = 800
        self.canvas_height = 600

        # Bind resize event
        self.bind("<Configure>", self._on_resize)

        # Start animation
        self.start_animation()

    def _on_resize(self, event):
        """Handle canvas resize.

        Args:
            event: Tkinter resize event
        """
        self.canvas_width = event.width
        self.canvas_height = event.height
        # Redraw gradient with new size
        self._draw_gradient(self._get_current_progress())

    def _get_current_progress(self) -> float:
        """Get current animation progress if animation is running.

        Returns:
            Progress value between 0.0 and 1.0
        """
        if self.animation and self.animation.is_running:
            # Estimate current progress based on elapsed time
            import time

            if self.animation.start_time:
                elapsed = (time.time() * 1000) - self.animation.start_time
                return min(elapsed / self.transition_speed, 1.0)
        return 0.0

    def _draw_gradient(self, progress: float):
        """Draw gradient on canvas.

        Args:
            progress: Animation progress (0.0 to 1.0)
        """
        # Clear canvas
        self.delete("all")

        # Get current and next colors
        current_color = self.colors[self.current_color_index]
        next_color = self.colors[(self.current_color_index + 1) % len(self.colors)]

        # Interpolate color
        interpolated_color = interpolate_color(current_color, next_color, progress)

        # Create vertical gradient effect (multiple rectangles with alpha)
        num_steps = 40
        for i in range(num_steps):
            # Calculate position
            y1 = (i / num_steps) * self.canvas_height
            y2 = ((i + 1) / num_steps) * self.canvas_height

            # Blend with next color based on position
            position_progress = i / num_steps
            step_color = interpolate_color(interpolated_color, next_color, position_progress * progress * 0.3)

            # Draw rectangle
            self.create_rectangle(0, y1, self.canvas_width, y2, fill=step_color, outline="")

    def _animate_transition(self, progress: float):
        """Animation callback for color transition.

        Args:
            progress: Animation progress (0.0 to 1.0)
        """
        self._draw_gradient(progress)

    def _on_transition_complete(self):
        """Called when transition animation completes."""
        # Move to next color
        self.current_color_index = (self.current_color_index + 1) % len(self.colors)

        # Restart animation for continuous loop
        if self.is_animating:
            self._start_next_transition()

    def _start_next_transition(self):
        """Start the next color transition."""
        if not self.is_animating:
            return

        self.animation = AnimationController(
            widget=self,
            duration_ms=self.transition_speed,
            update_callback=self._animate_transition,
            easing=linear,
            fps=self.fps,
            on_complete=self._on_transition_complete,
        )
        self.animation.start()

    def start_animation(self):
        """Start the gradient animation."""
        if self.is_animating:
            return

        self.is_animating = True
        self._start_next_transition()

    def stop_animation(self):
        """Stop the gradient animation."""
        self.is_animating = False
        if self.animation:
            self.animation.stop()
            self.animation = None

    def pause_animation(self):
        """Pause the gradient animation."""
        if self.animation:
            self.animation.pause()

    def resume_animation(self):
        """Resume the gradient animation."""
        if self.animation:
            self.animation.resume()

    def update_theme(self, new_colors: list[str]):
        """Update gradient colors (for theme switching).

        Args:
            new_colors: New list of hex colors
        """
        self.colors = new_colors.copy()
        self.current_color_index = 0

        # Redraw with new colors
        self._draw_gradient(0.0)

        # Restart animation with new colors
        if self.is_animating:
            if self.animation:
                self.animation.stop()
            self._start_next_transition()

    def set_speed(self, transition_speed_ms: int):
        """Change animation speed.

        Args:
            transition_speed_ms: New transition duration in milliseconds
        """
        self.transition_speed = transition_speed_ms

    def destroy(self):
        """Clean up animation before destroying widget."""
        self.stop_animation()
        super().destroy()
