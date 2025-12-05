"""Centralized color theme for GUI application."""

import customtkinter as ctk


class DarkTheme:
    """Dark theme color palette."""

    # Background colors
    BG_PRIMARY = "#0F1419"  # Main chat background
    BG_SECONDARY = "#1A1D28"  # Top bar, input panel
    BG_TERTIARY = "#2D3142"  # Input fields, buttons

    # Message bubble colors
    MSG_USER_BG = "#5B4FFF"  # User message bubble
    MSG_AI_BG = "#2D3142"  # AI message bubble
    MSG_SYSTEM_BG = "#2A2D37"  # System message bubble

    # Text colors
    TEXT_PRIMARY = "#FFFFFF"  # Main text (white)
    TEXT_SECONDARY = "#E8E9ED"  # AI message text (light gray)
    TEXT_TERTIARY = "#8B92A8"  # Placeholder, subtle text
    TEXT_ACCENT = "#8B92FF"  # AI badge, links

    # Button colors
    BTN_PRIMARY = "#5B4FFF"  # Primary action (Send)
    BTN_PRIMARY_HOVER = "#7B6FFF"  # Primary hover
    BTN_SECONDARY = "#3A3F52"  # Secondary actions
    BTN_SECONDARY_HOVER = "#4A5268"  # Secondary hover

    # Status colors
    STATUS_SUCCESS = "#4ADE80"  # Green - Ready, success
    STATUS_WARNING = "#FCD34D"  # Yellow - Warning
    STATUS_ERROR = "#F87171"  # Red - Error
    STATUS_INFO = "#60A5FA"  # Blue - Processing

    # Borders and separators
    BORDER_SUBTLE = "#2A2D37"
    BORDER_FOCUS = "#5B4FFF"


class LightTheme:
    """Light theme color palette."""

    # Background colors
    BG_PRIMARY = "#FFFFFF"  # Main chat background
    BG_SECONDARY = "#F5F5F7"  # Top bar, input panel
    BG_TERTIARY = "#E5E5EA"  # Input fields, buttons

    # Message bubble colors
    MSG_USER_BG = "#5B4FFF"  # User message bubble
    MSG_AI_BG = "#E5E5EA"  # AI message bubble
    MSG_SYSTEM_BG = "#F0F0F5"  # System message bubble

    # Text colors
    TEXT_PRIMARY = "#000000"  # Main text (black)
    TEXT_SECONDARY = "#1D1D1F"  # AI message text (dark gray)
    TEXT_TERTIARY = "#6E6E73"  # Placeholder, subtle text
    TEXT_ACCENT = "#5B4FFF"  # AI badge, links

    # Button colors
    BTN_PRIMARY = "#5B4FFF"  # Primary action (Send)
    BTN_PRIMARY_HOVER = "#4A3FE8"  # Primary hover
    BTN_SECONDARY = "#E5E5EA"  # Secondary actions
    BTN_SECONDARY_HOVER = "#D1D1D6"  # Secondary hover

    # Status colors
    STATUS_SUCCESS = "#34C759"  # Green - Ready, success
    STATUS_WARNING = "#FF9500"  # Orange - Warning
    STATUS_ERROR = "#FF3B30"  # Red - Error
    STATUS_INFO = "#007AFF"  # Blue - Processing

    # Borders and separators
    BORDER_SUBTLE = "#E5E5EA"
    BORDER_FOCUS = "#5B4FFF"


class ColorTheme:
    """Dynamic color theme that switches based on appearance mode."""

    # Initialize with dark theme
    BG_PRIMARY = DarkTheme.BG_PRIMARY
    BG_SECONDARY = DarkTheme.BG_SECONDARY
    BG_TERTIARY = DarkTheme.BG_TERTIARY

    MSG_USER_BG = DarkTheme.MSG_USER_BG
    MSG_AI_BG = DarkTheme.MSG_AI_BG
    MSG_SYSTEM_BG = DarkTheme.MSG_SYSTEM_BG

    TEXT_PRIMARY = DarkTheme.TEXT_PRIMARY
    TEXT_SECONDARY = DarkTheme.TEXT_SECONDARY
    TEXT_TERTIARY = DarkTheme.TEXT_TERTIARY
    TEXT_ACCENT = DarkTheme.TEXT_ACCENT

    BTN_PRIMARY = DarkTheme.BTN_PRIMARY
    BTN_PRIMARY_HOVER = DarkTheme.BTN_PRIMARY_HOVER
    BTN_SECONDARY = DarkTheme.BTN_SECONDARY
    BTN_SECONDARY_HOVER = DarkTheme.BTN_SECONDARY_HOVER

    STATUS_SUCCESS = DarkTheme.STATUS_SUCCESS
    STATUS_WARNING = DarkTheme.STATUS_WARNING
    STATUS_ERROR = DarkTheme.STATUS_ERROR
    STATUS_INFO = DarkTheme.STATUS_INFO

    BORDER_SUBTLE = DarkTheme.BORDER_SUBTLE
    BORDER_FOCUS = DarkTheme.BORDER_FOCUS

    # Radius
    RADIUS_SMALL = 10
    RADIUS_MEDIUM = 18
    RADIUS_LARGE = 25

    @classmethod
    def set_mode(cls, mode: str):
        """Set the theme mode (dark/light/system) and update all colors."""
        # Determine which theme to use
        if mode == "light":
            theme = LightTheme
        elif mode == "dark":
            theme = DarkTheme
        else:  # system
            current = ctk.get_appearance_mode().lower()
            theme = LightTheme if current == "light" else DarkTheme

        # Update all color attributes
        cls.BG_PRIMARY = theme.BG_PRIMARY
        cls.BG_SECONDARY = theme.BG_SECONDARY
        cls.BG_TERTIARY = theme.BG_TERTIARY

        cls.MSG_USER_BG = theme.MSG_USER_BG
        cls.MSG_AI_BG = theme.MSG_AI_BG
        cls.MSG_SYSTEM_BG = theme.MSG_SYSTEM_BG

        cls.TEXT_PRIMARY = theme.TEXT_PRIMARY
        cls.TEXT_SECONDARY = theme.TEXT_SECONDARY
        cls.TEXT_TERTIARY = theme.TEXT_TERTIARY
        cls.TEXT_ACCENT = theme.TEXT_ACCENT

        cls.BTN_PRIMARY = theme.BTN_PRIMARY
        cls.BTN_PRIMARY_HOVER = theme.BTN_PRIMARY_HOVER
        cls.BTN_SECONDARY = theme.BTN_SECONDARY
        cls.BTN_SECONDARY_HOVER = theme.BTN_SECONDARY_HOVER

        cls.STATUS_SUCCESS = theme.STATUS_SUCCESS
        cls.STATUS_WARNING = theme.STATUS_WARNING
        cls.STATUS_ERROR = theme.STATUS_ERROR
        cls.STATUS_INFO = theme.STATUS_INFO

        cls.BORDER_SUBTLE = theme.BORDER_SUBTLE
        cls.BORDER_FOCUS = theme.BORDER_FOCUS

    @classmethod
    def get_mode(cls):
        """Get current theme mode."""
        return "light" if cls.BG_PRIMARY == LightTheme.BG_PRIMARY else "dark"


class Fonts:
    """Font configurations."""

    SIZE_SMALL = 11
    SIZE_MEDIUM = 13
    SIZE_LARGE = 15
    SIZE_XLARGE = 26

    @staticmethod
    def title():
        """Title font configuration."""
        return {"size": Fonts.SIZE_XLARGE, "weight": "bold"}

    @staticmethod
    def message():
        """Message text font configuration."""
        return {"size": Fonts.SIZE_MEDIUM}

    @staticmethod
    def input():
        """Input field font configuration."""
        return {"size": Fonts.SIZE_LARGE}

    @staticmethod
    def button():
        """Button font configuration."""
        return {"size": Fonts.SIZE_LARGE, "weight": "bold"}

    @staticmethod
    def badge():
        """Small badge font configuration."""
        return {"size": Fonts.SIZE_SMALL, "weight": "bold"}


class Spacing:
    """Spacing and padding constants."""

    # Padding
    PAD_SMALL = 10
    PAD_MEDIUM = 18
    PAD_LARGE = 25
    PAD_XLARGE = 30

    # Margins
    MARGIN_SMALL = 8
    MARGIN_MEDIUM = 15
    MARGIN_LARGE = 20

    # Component sizes
    INPUT_HEIGHT = 50
    BUTTON_HEIGHT = 50
    TOPBAR_HEIGHT = 70
