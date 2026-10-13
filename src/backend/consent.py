"""Web consent gate. The web app has no way to ask the user for consent yet, so a fixed policy answers instead.

The policy is KNIK_WEB_TOOL_CONSENT: "deny" (the default) refuses every tool that needs consent, and the model
gets the refusal as the tool's result; "allow" runs them without asking anyone.
"""

from backend.config import ToolConsent
from imports import ConsentRequest, printer


class WebConsentGate:
    def __init__(self, policy: ToolConsent) -> None:
        self._policy = policy

    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> str:
        if self._policy == "allow":
            return "yes"
        printer.warning(
            f"Refused {req.tool_name}: web chats cannot ask for consent (KNIK_WEB_TOOL_CONSENT=allow runs it unasked)"
        )
        return "no"
