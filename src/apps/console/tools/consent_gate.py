"""Console consent gate — blocks on input() directly."""

from lib.services.ai_client.consent import ConsentRequest
from lib.services.ai_client.registry.mcp_registry import MCPServerRegistry
from lib.utils.printer import printer


class ConsoleConsentGate:
    def __init__(self, registry: MCPServerRegistry | None = None) -> None:
        self._registry = registry

    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> bool:
        args_preview = ", ".join(f"{k}={repr(v)[:60]}" for k, v in req.kwargs.items())
        printer.info(f"Consent prompt for {req.tool_name}")
        try:
            answer = input(f"\nAllow {req.tool_name}({args_preview})? [yes/yes all/no]: ").strip().lower()
            if answer in ("yes all", "ya"):
                if self._registry:
                    self._registry.approve_all_tools()
                printer.info("Consent granted for all tools")
                return True
            allowed = answer in ("yes", "y")
            printer.info(f"Consent {'granted' if allowed else 'denied'} for {req.tool_name}")
            return allowed
        except (EOFError, KeyboardInterrupt):
            printer.warning(f"Consent interrupted for {req.tool_name}")
            return False
