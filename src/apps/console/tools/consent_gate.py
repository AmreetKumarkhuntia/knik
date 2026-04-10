"""Console consent gate — blocks on input() directly."""

from lib.services.ai_client.consent import ConsentRequest
from lib.utils.printer import printer


class ConsoleConsentGate:
    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> str:
        args_preview = ", ".join(f"{k}={repr(v)[:60]}" for k, v in req.kwargs.items())
        printer.info(f"Consent prompt for {req.tool_name}")
        try:
            answer = input(f"\nAllow {req.tool_name}({args_preview})? [yes (y) / yes all (ya) / no]: ").strip().lower()
            if answer in ("yes all", "ya"):
                printer.info(f"Consent granted for all future {req.tool_name} calls")
                return "yes_all"
            if answer in ("yes", "y"):
                printer.info(f"Consent granted for {req.tool_name}")
                return "yes"
            printer.info(f"Consent denied for {req.tool_name}")
            return "no"
        except (EOFError, KeyboardInterrupt):
            printer.warning(f"Consent interrupted for {req.tool_name}")
            return "no"
