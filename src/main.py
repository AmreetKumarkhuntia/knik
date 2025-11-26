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


def main():
    """Main application function with mode selection."""
    parser = argparse.ArgumentParser(
        description="Knik - AI Console Application with Voice",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                   # Run interactive AI console (default)
  python main.py --mode console    # Run interactive AI console
  
For TTS demos, use: python demo/tts/demo.py
        """
    )
    
    parser.add_argument(
        '--mode',
        choices=['console'],
        default='console',
        help='Application mode (currently only console is available via main.py)'
    )
    
    args = parser.parse_args()
    
    if args.mode == 'console':
        run_console_app()
    else:
        printer.error(f"Unknown mode: {args.mode}")
        sys.exit(1)


if __name__ == "__main__":
    main()
