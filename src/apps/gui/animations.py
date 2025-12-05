"""Animation utilities for GUI components.

Provides easing functions, animation controllers, and helper utilities
for creating smooth, performant animations in the Knik GUI.
"""

from collections.abc import Callable


# ============================================================================
# Easing Functions
# ============================================================================


def linear(t: float) -> float:
    """Linear easing - no acceleration.

    Args:
        t: Progress value between 0.0 and 1.0

    Returns:
        Eased progress value
    """
    return t


def ease_in_out(t: float) -> float:
    """Smooth acceleration and deceleration (cubic).

    Args:
        t: Progress value between 0.0 and 1.0

    Returns:
        Eased progress value with smooth start and end
    """
    return t * t * (3 - 2 * t)


def ease_in(t: float) -> float:
    """Gradual acceleration (quadratic).

    Args:
        t: Progress value between 0.0 and 1.0

    Returns:
        Eased progress value with slow start
    """
    return t * t


def ease_out(t: float) -> float:
    """Gradual deceleration (quadratic).

    Args:
        t: Progress value between 0.0 and 1.0

    Returns:
        Eased progress value with slow end
    """
    return t * (2 - t)


def ease_out_back(t: float) -> float:
    """Deceleration with slight overshoot (bounce effect).

    Args:
        t: Progress value between 0.0 and 1.0

    Returns:
        Eased progress value with bounce at end
    """
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2)


def ease_in_back(t: float) -> float:
    """Acceleration with slight backward pull.

    Args:
        t: Progress value between 0.0 and 1.0

    Returns:
        Eased progress value with backward pull at start
    """
    c1 = 1.70158
    c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t


def cubic_bezier(t: float, p1: float = 0.42, p2: float = 0.0) -> float:
    """Custom cubic bezier easing curve.

    Args:
        t: Progress value between 0.0 and 1.0
        p1: First control point (default: 0.42 for ease-in-out)
        p2: Second control point (default: 0.0 for ease-in-out)

    Returns:
        Eased progress value
    """
    # Simplified cubic bezier approximation
    return 3 * p1 * (1 - t) ** 2 * t + 3 * p2 * (1 - t) * t**2 + t**3


# ============================================================================
# Color Utilities
# ============================================================================


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color to RGB tuple.

    Args:
        hex_color: Hex color string (e.g., "#FF5733" or "FF5733")

    Returns:
        RGB tuple (r, g, b) with values 0-255
    """
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB values to hex color string.

    Args:
        r: Red value (0-255)
        g: Green value (0-255)
        b: Blue value (0-255)

    Returns:
        Hex color string (e.g., "#FF5733")
    """
    return f"#{r:02x}{g:02x}{b:02x}"


def interpolate_color(color1: str, color2: str, t: float) -> str:
    """Interpolate between two colors.

    Args:
        color1: Start color (hex string)
        color2: End color (hex string)
        t: Progress value between 0.0 and 1.0

    Returns:
        Interpolated color as hex string
    """
    r1, g1, b1 = hex_to_rgb(color1)
    r2, g2, b2 = hex_to_rgb(color2)

    r = int(r1 + (r2 - r1) * t)
    g = int(g1 + (g2 - g1) * t)
    b = int(b1 + (b2 - b1) * t)

    return rgb_to_hex(r, g, b)


# ============================================================================
# Timing Utilities
# ============================================================================


def fps_to_ms(fps: int) -> int:
    """Convert frames per second to milliseconds per frame.

    Args:
        fps: Frames per second (e.g., 60)

    Returns:
        Milliseconds per frame (e.g., 16 for 60fps)
    """
    return int(1000 / fps)


def duration_to_frames(duration_ms: int, fps: int) -> int:
    """Calculate number of frames for a given duration.

    Args:
        duration_ms: Duration in milliseconds
        fps: Frames per second

    Returns:
        Number of frames
    """
    return int((duration_ms / 1000) * fps)


# ============================================================================
# Animation Controller
# ============================================================================


class AnimationController:
    """Controls a single animation with timing and easing."""

    def __init__(
        self,
        widget,
        duration_ms: int,
        update_callback: Callable[[float], None],
        easing: Callable[[float], float] = ease_in_out,
        fps: int = 60,
        on_complete: Callable[[], None] | None = None,
    ):
        """Initialize animation controller.

        Args:
            widget: The widget to animate (needs .after() and .after_cancel())
            duration_ms: Animation duration in milliseconds
            update_callback: Function called each frame with progress (0.0 to 1.0)
            easing: Easing function to apply to progress
            fps: Target frames per second (default: 60)
            on_complete: Optional callback when animation completes
        """
        self.widget = widget
        self.duration_ms = duration_ms
        self.update_callback = update_callback
        self.easing = easing
        self.fps = fps
        self.on_complete = on_complete

        self.start_time: float | None = None
        self.after_id: str | None = None
        self.is_running = False
        self.is_paused = False
        self.pause_time = 0
        self.elapsed_pause = 0

    def start(self):
        """Start the animation."""
        if self.is_running:
            return

        import time

        self.start_time = time.time() * 1000  # Convert to milliseconds
        self.is_running = True
        self.is_paused = False
        self.elapsed_pause = 0
        self._animate()

    def stop(self):
        """Stop the animation immediately."""
        if self.after_id:
            self.widget.after_cancel(self.after_id)
            self.after_id = None
        self.is_running = False
        self.is_paused = False

    def pause(self):
        """Pause the animation."""
        if not self.is_running or self.is_paused:
            return

        import time

        self.is_paused = True
        self.pause_time = time.time() * 1000

        if self.after_id:
            self.widget.after_cancel(self.after_id)
            self.after_id = None

    def resume(self):
        """Resume a paused animation."""
        if not self.is_paused:
            return

        import time

        current_time = time.time() * 1000
        self.elapsed_pause += current_time - self.pause_time
        self.is_paused = False
        self._animate()

    def _animate(self):
        """Internal animation loop."""
        if not self.is_running or self.is_paused:
            return

        import time

        current_time = time.time() * 1000
        elapsed = current_time - self.start_time - self.elapsed_pause

        # Calculate progress (0.0 to 1.0)
        progress = min(elapsed / self.duration_ms, 1.0)

        # Apply easing
        eased_progress = self.easing(progress)

        # Call update callback
        try:
            self.update_callback(eased_progress)
        except Exception as e:
            print(f"Animation update error: {e}")
            self.stop()
            return

        # Continue animation or complete
        if progress < 1.0:
            frame_delay = fps_to_ms(self.fps)
            self.after_id = self.widget.after(frame_delay, self._animate)
        else:
            self.is_running = False
            if self.on_complete:
                try:
                    self.on_complete()
                except Exception as e:
                    print(f"Animation complete callback error: {e}")


# ============================================================================
# Multi-Animation Controller
# ============================================================================


class AnimationGroup:
    """Manages multiple animations together."""

    def __init__(self):
        """Initialize animation group."""
        self.animations: list[AnimationController] = []

    def add(self, animation: AnimationController):
        """Add animation to the group.

        Args:
            animation: AnimationController instance
        """
        self.animations.append(animation)

    def start_all(self):
        """Start all animations in the group."""
        for anim in self.animations:
            anim.start()

    def stop_all(self):
        """Stop all animations in the group."""
        for anim in self.animations:
            anim.stop()
        self.animations.clear()

    def pause_all(self):
        """Pause all animations in the group."""
        for anim in self.animations:
            anim.pause()

    def resume_all(self):
        """Resume all paused animations in the group."""
        for anim in self.animations:
            anim.resume()

    def is_any_running(self) -> bool:
        """Check if any animation is still running.

        Returns:
            True if at least one animation is running
        """
        return any(anim.is_running for anim in self.animations)

    def cleanup_finished(self):
        """Remove completed animations from the group."""
        self.animations = [anim for anim in self.animations if anim.is_running]


# ============================================================================
# Value Interpolation Utilities
# ============================================================================


def interpolate_value(start: float, end: float, t: float) -> float:
    """Linearly interpolate between two values.

    Args:
        start: Start value
        end: End value
        t: Progress value between 0.0 and 1.0

    Returns:
        Interpolated value
    """
    return start + (end - start) * t


def interpolate_position(start_x: float, start_y: float, end_x: float, end_y: float, t: float) -> tuple[float, float]:
    """Interpolate between two 2D positions.

    Args:
        start_x: Start X coordinate
        start_y: Start Y coordinate
        end_x: End X coordinate
        end_y: End Y coordinate
        t: Progress value between 0.0 and 1.0

    Returns:
        Tuple of (x, y) interpolated coordinates
    """
    x = interpolate_value(start_x, end_x, t)
    y = interpolate_value(start_y, end_y, t)
    return (x, y)
