"""Knik launcher. Run from the repo root: ``python src/main.py --mode backend|bot|worker|console``."""

import argparse
import asyncio
import sys
from collections.abc import Callable

from imports import printer


def run_backend() -> None:
    import uvicorn

    from backend.config import WebBackendConfig

    config = WebBackendConfig()
    uvicorn.run("backend.main:app", host=config.host, port=config.port, reload=config.reload, log_level="info")


def run_bot() -> None:
    from bot import BotApp, BotConfig

    asyncio.run(BotApp(BotConfig()).run())


def run_worker() -> None:
    from worker.app import main as worker_main

    worker_main()


def run_console() -> None:
    from console import ConsoleApp, ConsoleConfig

    ConsoleApp(ConsoleConfig()).run()


RUNNERS: dict[str, Callable[[], None]] = {
    "backend": run_backend,
    "bot": run_bot,
    "worker": run_worker,
    "console": run_console,
}

# "cron" is the historical name of the worker mode.
ALIASES = {"cron": "worker"}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Knik - AI assistant with voice, workflows and a messaging bot",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python src/main.py --mode backend    # FastAPI web backend
  python src/main.py --mode bot        # Telegram bot daemon
  python src/main.py --mode worker     # Workflow scheduler (alias: cron)
  python src/main.py --mode console    # Interactive terminal chat
        """,
    )
    parser.add_argument(
        "--mode",
        choices=[*RUNNERS, *ALIASES],
        default="backend",
        help="Process to run: backend, bot, worker (alias: cron) or console",
    )
    args = parser.parse_args()
    mode = ALIASES.get(args.mode, args.mode)

    try:
        RUNNERS[mode]()
    except ImportError as e:
        printer.error(f"Failed to import the {mode} app: {e}")
        printer.error("Run from the repo root with dependencies from requirements.txt installed")
        sys.exit(1)
    except Exception as e:
        printer.error(f"The {mode} app stopped with an error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
