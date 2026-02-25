"""
Knik - Text-to-Speech Application
Main entry point for the application.
"""

import argparse
import sys

from lib import printer


def run_console_app():
    """Run the interactive console application."""
    try:
        from apps.console import ConsoleApp, ConsoleConfig

        config = ConsoleConfig()
        app = ConsoleApp(config)
        app.run()
    except ImportError as e:
        printer.error(f"Failed to import console app: {e}")
        printer.error("Make sure you're running from the src/ directory")
        sys.exit(1)
    except Exception as e:
        printer.error(f"Failed to start console app: {e}")
        sys.exit(1)


def run_gui_app():
    """Run the GUI application."""
    try:
        from apps.gui import GUIApp, GUIConfig

        config = GUIConfig()
        app = GUIApp(config)
        app.run()
    except ImportError as e:
        printer.error(f"Failed to import GUI app: {e}")
        printer.error("Make sure you have customtkinter installed: pip install customtkinter>=5.2.0")
        sys.exit(1)
    except Exception as e:
        printer.error(f"Failed to start GUI app: {e}")
        sys.exit(1)


def run_cron_app():
    """Run the background CRON scheduler app."""
    try:
        import asyncio

        from apps.cron_job.app import CronJobApp

        app = CronJobApp()
        asyncio.run(app.run())
    except ImportError as e:
        printer.error(f"Failed to import cron app: {e}")
        sys.exit(1)
    except Exception as e:
        printer.error(f"Failed to start cron app: {e}")
        sys.exit(1)


def main():
    """Main application function with mode selection."""
    parser = argparse.ArgumentParser(
        description="Knik - AI Console Application with Voice",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                   # Run GUI application (default)
  python main.py --mode gui        # Run GUI application
  python main.py --mode console    # Run terminal console

For TTS demos, use: python demo/tts/demo.py
        """,
    )

    parser.add_argument(
        "--mode",
        choices=["console", "gui", "cron"],
        default="gui",
        help="Application mode: console, gui, or cron (background scheduler)",
    )

    args = parser.parse_args()

    if args.mode == "console":
        run_console_app()
    elif args.mode == "gui":
        run_gui_app()
    elif args.mode == "cron":
        run_cron_app()
    else:
        printer.error(f"Unknown mode: {args.mode}")
        sys.exit(1)


if __name__ == "__main__":
    main()
