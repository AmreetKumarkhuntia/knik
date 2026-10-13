"""The typed errors the workflow and schedule services raise."""

from lib.workflows.errors import NotFoundError, ValidationError, WorkflowError


def test_errors_carry_the_dict_the_ai_tools_return():
    error = ValidationError("Invalid schedule description: nope", hint="Try 'hourly'")

    assert str(error) == error.message == "Invalid schedule description: nope"
    assert error.to_dict() == {"error": "Invalid schedule description: nope", "hint": "Try 'hourly'"}
    assert WorkflowError("plain").to_dict() == {"error": "plain"}


def test_both_kinds_are_workflow_errors_and_value_errors():
    for error in (NotFoundError("Workflow w not found"), ValidationError("schedule_description is required")):
        assert isinstance(error, WorkflowError)
        assert isinstance(error, ValueError)
    assert not issubclass(NotFoundError, ValidationError)
    assert not issubclass(ValidationError, NotFoundError)
