"""Browser automation tool definitions for MCP."""

BROWSER_DEFINITIONS = [
    {
        "name": "browser_navigate",
        "description": (
            "Open a URL in the browser. "
            "Use this to visit websites like LinkedIn, Indeed, Google, or any other site. "
            "Returns the page title and a short status message. "
            "The browser window is visible by default so the user can interact with it (e.g. sign in). "
            "Always call this first before using other browser tools."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "Full URL to navigate to (e.g. 'https://www.indeed.com').",
                },
                "wait_until": {
                    "type": "string",
                    "description": "When to consider navigation done: 'load', 'domcontentloaded', or 'networkidle'.",
                    "default": "domcontentloaded",
                },
            },
            "required": ["url"],
        },
    },
    {
        "name": "browser_get_text",
        "description": (
            "Extract all visible text from the current browser page. "
            "Use after browser_navigate. Returns cleaned, readable text — great for reading job descriptions, "
            "article content, or any page information."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": (
                        "Optional CSS selector to limit text extraction to a specific element "
                        "(e.g. 'main', '#job-description', '.content'). "
                        "If omitted, extracts text from the entire page body."
                    ),
                    "default": None,
                },
                "max_chars": {
                    "type": "integer",
                    "description": "Maximum number of characters to return. Default 8000.",
                    "default": 8000,
                },
            },
            "required": [],
        },
    },
    {
        "name": "browser_get_links",
        "description": (
            "Extract all hyperlinks (anchor tags) from the current browser page. "
            "Returns a list of {text, href} pairs. "
            "Useful for finding job listing links, navigation menus, or any clickable links on a page."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "Optional CSS selector to limit link extraction to a specific section.",
                    "default": None,
                },
                "max_links": {
                    "type": "integer",
                    "description": "Maximum number of links to return. Default 50.",
                    "default": 50,
                },
            },
            "required": [],
        },
    },
    {
        "name": "browser_click",
        "description": (
            "Click an element on the current page. "
            "You can target by CSS selector (e.g. 'button.apply-btn') or by visible text (e.g. 'Apply Now'). "
            "Use this to click job listings, submit forms, open menus, or press buttons."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector of the element to click (e.g. 'button#submit', 'a.job-link').",
                    "default": None,
                },
                "text": {
                    "type": "string",
                    "description": (
                        "Visible text of the element to click. "
                        "Used when you don't know the CSS selector. "
                        "Provide EITHER selector OR text."
                    ),
                    "default": None,
                },
                "timeout": {
                    "type": "integer",
                    "description": "Maximum milliseconds to wait for element. Default 5000.",
                    "default": 5000,
                },
            },
            "required": [],
        },
    },
    {
        "name": "browser_type",
        "description": (
            "Type text into an input field on the current page. "
            "Use this to fill search boxes, form fields, email/password inputs, etc. "
            "Target the field with a CSS selector (e.g. 'input[name=\"q\"]', '#email')."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector of the input element to type into.",
                },
                "text": {
                    "type": "string",
                    "description": "Text to type into the field.",
                },
                "clear_first": {
                    "type": "boolean",
                    "description": "Whether to clear existing text in the field before typing. Default true.",
                    "default": True,
                },
                "press_enter": {
                    "type": "boolean",
                    "description": "Whether to press Enter after typing (useful for search boxes). Default false.",
                    "default": False,
                },
            },
            "required": ["selector", "text"],
        },
    },
    {
        "name": "browser_screenshot",
        "description": (
            "Take a screenshot of the current browser page and return it as a base64-encoded PNG string. "
            "Useful for visually verifying what is displayed on a page, "
            "checking form states, or confirming navigation succeeded."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "full_page": {
                    "type": "boolean",
                    "description": "Whether to capture the full scrollable page or just the visible viewport. Default false.",
                    "default": False,
                },
            },
            "required": [],
        },
    },
]
