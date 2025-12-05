# Animation Implementation Tracker

**Session Date:** December 6, 2025  
**Feature:** GUI Animation Enhancement  
**Status:** 🟡 In Progress

---

## 📋 Implementation Plan

### Phase 1: Foundation

#### ✅ Todo 4: Animation Utilities Module
**File:** `src/apps/gui/animations.py`

**Components to Build:**

1. **Easing Functions**
   - `ease_in_out(t)` - Smooth acceleration and deceleration
   - `ease_out_back(t)` - Bounce effect at the end
   - `cubic_bezier(t, p1, p2)` - Custom bezier curves
   - `linear(t)` - Simple linear interpolation

2. **AnimationController Class**
   - `start()` - Begin animation
   - `stop()` - Cancel animation
   - `pause()` / `resume()` - Control playback
   - `on_complete(callback)` - Completion handler
   - Frame timing with `after()`

3. **Helper Utilities**
   - `interpolate_color(color1, color2, t)` - RGB color blending
   - `fps_to_ms(fps)` - Convert frame rate to milliseconds
   - `duration_to_frames(duration_ms, fps)` - Calculate frame count

**Status:** Not Started  
**Estimated Time:** 1-2 hours  
**Priority:** High (blocks other todos)

---

#### ⬜ Todo 1: Animated Gradient Background
**File:** `src/apps/gui/components/gradient_background.py`

**Components to Build:**

1. **GradientBackground Class** (extends CTkCanvas)
   - `__init__(master, colors, transition_speed)`
   - `_animate_gradient()` - Main animation loop
   - `_draw_gradient(color1, color2, progress)` - Render gradient
   - `update_theme(theme)` - Switch color palette

2. **Gradient Color Palettes** (add to `theme.py`)
   ```python
   # Dark Mode Gradients
   GRADIENT_DARK_COLORS = [
       "#001F3F",  # Deep blue
       "#2C1B47",  # Purple
       "#004D4D",  # Teal
   ]
   
   # Light Mode Gradients
   GRADIENT_LIGHT_COLORS = [
       "#E0F2FE",  # Light blue
       "#EDE9FE",  # Light purple
       "#CCFBF1",  # Light teal
   ]
   ```

3. **Animation Settings**
   - Transition Duration: 8000ms (8 seconds per full cycle)
   - FPS: 30 (sufficient for smooth gradient)
   - Loop: Infinite with color rotation

**Status:** Not Started  
**Estimated Time:** 2-3 hours  
**Priority:** High (visual impact)  
**Dependencies:** Todo 4 (Animation utilities)

---

### Phase 2: Chat Animations

#### ⬜ Todo 2: Slide-In Message Animation
**Location:** `src/apps/gui/components/chat_panel.py`

**Implementation Details:**

1. **Add Animation Method**
   ```python
   def _animate_slide_in(self, widget, direction, duration=350):
       # direction: "left" | "right" | "center"
       # Animate from offset position to final position
   ```

2. **Animation Specs:**
   - **User Messages:** Slide from right (+50px X offset → 0)
   - **AI Messages:** Slide from left (-50px X offset → 0)
   - **System Messages:** Fade in center (opacity 0 → 1)
   - **Duration:** 350ms
   - **Easing:** `ease_out_back` (slight bounce)

3. **Integration Points:**
   - Call `_animate_slide_in()` after creating message_frame in `_add_message()`
   - Store animation reference for cleanup
   - Skip if `self.animations_enabled == False`

**Status:** Not Started  
**Estimated Time:** 2 hours  
**Priority:** Medium  
**Dependencies:** Todo 4 (Animation utilities)

---

#### ⬜ Todo 3: Word-by-Word Text Fade
**Location:** `src/apps/gui/components/chat_panel.py`

**Implementation Details:**

1. **Add Text Animation Method**
   ```python
   def _animate_text_reveal(self, label, text, word_delay=40):
       # Split text into words
       # Progressively update label text with fade effect
   ```

2. **Animation Approach:**
   - Split message into words: `words = text.split()`
   - Start with empty label
   - Every 40ms, add next word with fade transition
   - Use label configure with text updates

3. **Alternative Approach (Opacity-based):**
   - Create multiple labels (one per word)
   - Animate opacity from 0.0 → 1.0 per label
   - More complex but smoother visual effect

4. **Animation Specs:**
   - Per-word reveal duration: 100ms
   - Delay between words: 40ms
   - Total animation time: `(num_words * 40ms) + 100ms`

**Status:** Not Started  
**Estimated Time:** 2-3 hours  
**Priority:** Medium  
**Dependencies:** Todo 4 (Animation utilities)

**Challenge:** CustomTkinter doesn't support per-widget opacity. May need to use color alpha blending or canvas text rendering.

---

### Phase 3: Integration & Polish

#### ⬜ Todo 5: Integrate Animations into ChatPanel
**File:** `src/apps/gui/components/chat_panel.py`

**Changes Required:**

1. **Import Animations**
   ```python
   from ..animations import AnimationController, ease_out_back, interpolate_color
   ```

2. **Add Instance Variables**
   ```python
   def __init__(self, master, **kwargs):
       # ... existing code ...
       self.animations_enabled = True  # From config
       self.active_animations = []  # Track running animations
   ```

3. **Modify `_add_message()`**
   ```python
   def _add_message(self, text, is_user, is_system=False):
       # ... create message_frame ...
       
       if self.animations_enabled:
           # Slide animation
           direction = "right" if is_user else ("center" if is_system else "left")
           anim = self._animate_slide_in(message_frame, direction)
           self.active_animations.append(anim)
           
           # Text reveal animation
           if not is_system:
               text_anim = self._animate_text_reveal(message_label, text)
               self.active_animations.append(text_anim)
   ```

4. **Add Cleanup Method**
   ```python
   def stop_all_animations(self):
       for anim in self.active_animations:
           anim.stop()
       self.active_animations.clear()
   ```

**Status:** Not Started  
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** Todo 2, 3, 4

---

#### ⬜ Todo 6: Add Gradient Background to Main Window
**Files:** `src/apps/gui/app.py`, `src/apps/gui/theme.py`

**Changes Required:**

1. **Update theme.py** - Add gradient colors (see Todo 1)

2. **Update app.py** - Add gradient layer
   ```python
   def _create_ui(self):
       # Add gradient background (lowest layer)
       from .components.gradient_background import GradientBackground
       
       colors = ColorTheme.GRADIENT_DARK_COLORS if ColorTheme.get_mode() == "dark" else ColorTheme.GRADIENT_LIGHT_COLORS
       self.gradient_bg = GradientBackground(self, colors=colors)
       self.gradient_bg.place(x=0, y=0, relwidth=1, relheight=1)
       
       # ... existing UI components on top ...
   ```

3. **Update `_refresh_theme()`**
   ```python
   def _refresh_theme(self):
       # ... existing theme updates ...
       
       # Update gradient colors
       if hasattr(self, 'gradient_bg'):
           new_colors = ColorTheme.GRADIENT_DARK_COLORS if ColorTheme.get_mode() == "dark" else ColorTheme.GRADIENT_LIGHT_COLORS
           self.gradient_bg.update_theme(new_colors)
   ```

**Status:** Not Started  
**Estimated Time:** 1 hour  
**Priority:** Medium  
**Dependencies:** Todo 1

---

#### ⬜ Todo 7: Test and Optimize Performance
**Testing Scenarios:**

1. **Rapid Message Sending**
   - Send 10 messages in quick succession
   - Verify animations don't queue up excessively
   - Check CPU usage stays below 15%

2. **Long Messages**
   - Send message with 500+ words
   - Verify text animation completes in reasonable time
   - Consider adding max animation duration cap

3. **Theme Switching**
   - Switch theme during active animations
   - Verify gradient transitions smoothly
   - Check no visual glitches

4. **Animation Toggle**
   - Enable/disable animations via settings
   - Verify messages display instantly when disabled
   - Check no animation artifacts remain

5. **Performance Profiling**
   ```python
   import cProfile
   import pstats
   
   profiler = cProfile.Profile()
   profiler.enable()
   # ... perform animation test ...
   profiler.disable()
   stats = pstats.Stats(profiler)
   stats.sort_stats('cumtime')
   stats.print_stats(20)
   ```

**Optimization Strategies:**

- Limit concurrent animations (max 5 at once)
- Add frame rate limiting (30fps for gradients, 60fps for message animations)
- Pre-calculate easing values for common durations
- Use canvas caching for gradient rendering
- Add animation skip button for impatient users

**Status:** Not Started  
**Estimated Time:** 2-3 hours  
**Priority:** High (quality assurance)  
**Dependencies:** All previous todos

---

## 📝 Technical Specifications

### Animation Parameters

| Feature | Duration | FPS | Easing | Notes |
|---------|----------|-----|--------|-------|
| Gradient Background | 8000ms | 30 | linear | Continuous loop |
| Message Slide-In | 350ms | 60 | ease_out_back | Slight bounce |
| Text Fade-In | 40ms/word | 60 | ease_in | Progressive reveal |
| System Message Fade | 200ms | 60 | ease_in_out | Center fade |

### Color Specifications

**Dark Mode Gradient:**
- Start: `#001F3F` (Deep Blue)
- Mid: `#2C1B47` (Purple)
- End: `#004D4D` (Teal)

**Light Mode Gradient:**
- Start: `#E0F2FE` (Light Blue)
- Mid: `#EDE9FE` (Light Purple)
- End: `#CCFBF1` (Light Teal)

### Performance Targets

- **CPU Usage:** < 10% during active animations
- **Frame Rate:** 60fps for chat animations, 30fps for gradient
- **Animation Start Delay:** < 16ms (one frame)
- **Memory Overhead:** < 5MB for animation system

---

## 🎯 Current Status

**Last Updated:** December 6, 2025

**Progress:**
- [x] Planning complete
- [x] Session tracker created
- [ ] Implementation started

**Next Steps:**
1. Start with Todo 4 (Animation utilities module)
2. Build gradient background (Todo 1)
3. Implement message animations (Todo 2, 3)
4. Integrate and test (Todo 5, 6, 7)

**Blockers:** None

---

## 📚 References

**CustomTkinter Animation Patterns:**
- Use `widget.after(ms, callback)` for frame updates
- Store `after_id` for cancellation: `widget.after_cancel(after_id)`
- Use `place()` for position-based animations
- Use `configure()` for property-based animations

**Color Interpolation Formula:**
```python
def interpolate_color(color1, color2, t):
    r1, g1, b1 = hex_to_rgb(color1)
    r2, g2, b2 = hex_to_rgb(color2)
    r = int(r1 + (r2 - r1) * t)
    g = int(g1 + (g2 - g1) * t)
    b = int(b1 + (b2 - b1) * t)
    return rgb_to_hex(r, g, b)
```

**Easing Function Examples:**
```python
def ease_in_out(t):
    return t * t * (3 - 2 * t)

def ease_out_back(t):
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2)
```

---

**This document will be updated as implementation progresses.**
