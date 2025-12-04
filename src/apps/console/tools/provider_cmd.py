"""Provider command for switching AI providers."""

from imports import AIClient, printer
from lib.services.ai_client.registry import MCPServerRegistry, ProviderRegistry


def provider_command(app, args: str) -> str:
    """
    Switch AI provider or list available providers.

    Usage:
        /provider              - Show current provider and list available ones
        /provider <name>       - Switch to specified provider (vertex, langchain, mock)
    """
    args = args.strip().lower()

    # Show current provider and list available
    if not args:
        current = app.ai_client.provider_name if app.ai_client else "unknown"
        available = ProviderRegistry.list_providers()

        result = f"📡 Current provider: {current}\n\n"
        result += "Available providers:\n"
        for provider in available:
            indicator = "→" if provider == current else " "
            result += f"  {indicator} {provider}\n"
        result += "\nUsage: /provider <name>"
        return result

    # Validate provider
    if not ProviderRegistry.is_registered(args):
        available = ", ".join(ProviderRegistry.list_providers())
        return f"❌ Unknown provider '{args}'. Available: {available}"

    # Switch provider
    try:
        old_provider = app.ai_client.provider_name if app.ai_client else "unknown"

        # Create new AI client with the selected provider
        app.ai_client = AIClient(
            provider=args,
            mcp_registry=MCPServerRegistry,
            system_instruction=app.config.system_instruction,
            project_id=app.config.ai_project_id,
            location=app.config.ai_location,
            model_name=app.config.ai_model,
        )

        printer.success(f"Switched AI provider: {old_provider} → {args}")
        return f"✓ Provider changed to: {args} 📡"

    except Exception as e:
        printer.error(f"Failed to switch provider: {e}")
        return f"❌ Error switching provider: {e}"
