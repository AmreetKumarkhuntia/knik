"""Console consent gate — blocks on input() directly."""

from imports import ConsentRequest, format_consent_prompt, parse_consent_reply, printer


CONSOLE_CONSENT_CHOICES = "[yes (y) / yes all (ya) / no]"


class ConsoleConsentGate:
    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> str:
        printer.info(f"Consent prompt for {req.tool_name}")
        try:
            answer = parse_consent_reply(input(f"\n{format_consent_prompt(req, CONSOLE_CONSENT_CHOICES)}: "))
            if answer == "yes_all":
                printer.info(f"Consent granted for all future {req.tool_name} calls")
                return "yes_all"
            if answer == "yes":
                printer.info(f"Consent granted for {req.tool_name}")
                return "yes"
            printer.info(f"Consent denied for {req.tool_name}")
            return "no"
        except (EOFError, KeyboardInterrupt):
            printer.warning(f"Consent interrupted for {req.tool_name}")
            return "no"
