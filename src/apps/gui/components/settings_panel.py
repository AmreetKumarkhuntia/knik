"""Settings panel component for configuration."""

from collections.abc import Callable

import customtkinter as ctk


class SettingsPanel(ctk.CTkToplevel):
    """Settings window for configuration."""

    def __init__(self, master, config, on_save: Callable | None = None, **kwargs):
        super().__init__(master, **kwargs)

        self.config = config
        self.on_save = on_save

        self.title("Settings")
        self.geometry("600x700")
        self.resizable(False, False)
        self.transient(master)
        self.grab_set()
        self.grid_columnconfigure(0, weight=1)

        self._create_widgets()

    def _create_widgets(self):
        """Create all settings widgets."""
        row = 0

        title = ctk.CTkLabel(self, text="Knik Settings", font=ctk.CTkFont(size=20, weight="bold"))
        title.grid(row=row, column=0, padx=20, pady=(20, 10), sticky="w")
        row += 1

        self._create_section_header("AI Provider", row)
        row += 1

        ctk.CTkLabel(self, text="Provider:", anchor="w").grid(row=row, column=0, padx=20, pady=(5, 0), sticky="w")
        row += 1

        self.provider_var = ctk.StringVar(value=self.config.ai_provider)
        self.provider_dropdown = ctk.CTkOptionMenu(
            self, values=["vertex", "mock"], variable=self.provider_var, width=200
        )
        self.provider_dropdown.grid(row=row, column=0, padx=20, pady=(0, 10), sticky="w")
        row += 1

        ctk.CTkLabel(self, text="Model:", anchor="w").grid(row=row, column=0, padx=20, pady=(5, 0), sticky="w")
        row += 1

        self.model_var = ctk.StringVar(value=self.config.ai_model)
        self.model_dropdown = ctk.CTkOptionMenu(
            self, values=["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"], variable=self.model_var, width=200
        )
        self.model_dropdown.grid(row=row, column=0, padx=20, pady=(0, 10), sticky="w")
        row += 1

        ctk.CTkLabel(self, text="Temperature:", anchor="w").grid(row=row, column=0, padx=20, pady=(5, 0), sticky="w")
        row += 1

        self.temperature_var = ctk.DoubleVar(value=self.config.temperature)
        self.temperature_slider = ctk.CTkSlider(
            self, from_=0.0, to=2.0, variable=self.temperature_var, number_of_steps=20
        )
        self.temperature_slider.grid(row=row, column=0, padx=20, pady=(0, 5), sticky="ew")
        row += 1

        self.temp_label = ctk.CTkLabel(self, text=f"{self.config.temperature:.1f}", anchor="w")
        self.temp_label.grid(row=row, column=0, padx=20, pady=(0, 10), sticky="w")
        self.temperature_slider.configure(command=self._update_temp_label)
        row += 1

        self._create_section_header("Voice Settings", row)
        row += 1

        self.voice_enabled_var = ctk.BooleanVar(value=self.config.enable_voice_output)
        self.voice_toggle = ctk.CTkSwitch(
            self, text="Enable Voice Output", variable=self.voice_enabled_var, onvalue=True, offvalue=False
        )
        self.voice_toggle.grid(row=row, column=0, padx=20, pady=(5, 10), sticky="w")
        row += 1

        ctk.CTkLabel(self, text="Voice:", anchor="w").grid(row=row, column=0, padx=20, pady=(5, 0), sticky="w")
        row += 1

        self.voice_var = ctk.StringVar(value=self.config.voice_name)
        self.voice_dropdown = ctk.CTkOptionMenu(
            self,
            values=["af_sarah", "af_heart", "af_bella", "am_adam", "am_michael", "am_leo"],
            variable=self.voice_var,
            width=200,
        )
        self.voice_dropdown.grid(row=row, column=0, padx=20, pady=(0, 10), sticky="w")
        row += 1

        self._create_section_header("Appearance", row)
        row += 1

        ctk.CTkLabel(self, text="Theme:", anchor="w").grid(row=row, column=0, padx=20, pady=(5, 0), sticky="w")
        row += 1

        self.theme_var = ctk.StringVar(value=self.config.appearance_mode)
        self.theme_dropdown = ctk.CTkOptionMenu(
            self,
            values=["dark", "light", "system"],
            variable=self.theme_var,
            width=200,
            command=self._change_appearance_mode,
        )
        self.theme_dropdown.grid(row=row, column=0, padx=20, pady=(0, 20), sticky="w")
        row += 1

        button_frame = ctk.CTkFrame(self, fg_color="transparent")
        button_frame.grid(row=row, column=0, padx=20, pady=20, sticky="ew")
        button_frame.grid_columnconfigure(0, weight=1)
        button_frame.grid_columnconfigure(1, weight=1)

        self.cancel_button = ctk.CTkButton(
            button_frame, text="Cancel", command=self._handle_cancel, fg_color="gray40", hover_color="gray50"
        )
        self.cancel_button.grid(row=0, column=0, padx=(0, 5), sticky="ew")

        self.save_button = ctk.CTkButton(button_frame, text="Save", command=self._handle_save)
        self.save_button.grid(row=0, column=1, padx=(5, 0), sticky="ew")

    def _create_section_header(self, text: str, row: int):
        """Create a section header."""
        header = ctk.CTkLabel(self, text=text, font=ctk.CTkFont(size=16, weight="bold"), anchor="w")
        header.grid(row=row, column=0, padx=20, pady=(15, 5), sticky="w")

    def _update_temp_label(self, value):
        """Update temperature label."""
        self.temp_label.configure(text=f"{float(value):.1f}")

    def _change_appearance_mode(self, mode: str):
        """Change appearance mode."""
        from ..theme import ColorTheme

        ctk.set_appearance_mode(mode)
        ColorTheme.set_mode(mode)

    def _handle_save(self):
        """Save settings."""
        self.config.ai_provider = self.provider_var.get()
        self.config.ai_model = self.model_var.get()
        self.config.temperature = self.temperature_var.get()
        self.config.enable_voice_output = self.voice_enabled_var.get()
        self.config.voice_name = self.voice_var.get()
        self.config.appearance_mode = self.theme_var.get()

        if self.on_save:
            self.on_save(self.config)

        self.destroy()

    def _handle_cancel(self):
        """Cancel and close."""
        self.destroy()
