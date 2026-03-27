"""Model command for switching AI models."""

from imports import AIClient, printer


def model_command(app, args: str) -> str:
    """
    Switch AI model or show current model.

    Usage:
        /model                     - Show current model
        /model <name>              - Switch to specified model

    Common models:
        - gemini-1.5-pro          - Most capable (default)
        - gemini-1.5-flash        - Faster, more cost-efficient
        - gemini-1.0-pro          - Previous generation
    """
    args = args.strip()

    if not args:
        current_model = app.config.ai_model
        result = f"🤖 Current model: {current_model}\n\n"
        result += "Common models:\n"
        result += "  • gemini-1.5-pro       - Most capable (default)\n"
        result += "  • gemini-1.5-flash     - Faster, cost-efficient\n"
        result += "  • gemini-1.0-pro       - Previous generation\n"
        result += "\nUsage: /model <name>"
        return result

    try:
        old_model = app.config.ai_model

        app.config.ai_model = args

        app.ai_client = AIClient(
            provider=app.ai_client.provider if app.ai_client else app.config.ai_provider,
            mcp_registry=app.mcp_registry,
            system_instruction=app.config.system_instruction,
            project_id=app.config.ai_project_id,
            location=app.config.ai_location,
            model_name=args,
        )

        printer.success(f"Switched AI model: {old_model} → {args}")
        return f"✓ Model changed to: {args} 🤖"

    except Exception as e:
        printer.error(f"Failed to switch model: {e}")
        return f"❌ Error switching model: {e}"
