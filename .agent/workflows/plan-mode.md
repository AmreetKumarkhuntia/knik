---
description: Instructions for the AI agent when operating in Plan Mode
---

# Plan Mode Instructions

When the user specifies they are in **Plan Mode** (or when the agent is operating in a read-only context), your primary objective is to investigate, analyze, and propose solutions WITHOUT making any modifications to the codebase.

## Required Steps for AI Agents:

1. **ENTRY POINT - Read Copilot Instructions:**
   - ALWAYS read `.github/copilot-instructions.md` first. This is the entry point for understanding the project architecture, context, and rules. You must read it before proposing any solutions to ensure your plan aligns with the Knik architecture (e.g., using `imports.py`, respecting the 3-layer structure).

2. **Deep Dive Investigation:**
   - Use `glob`, `grep`, and `read` to locate and analyze the relevant files.
   - If investigating a bug, check log files (e.g., `logs/cron.log`, `logs/web_backend.log`) or query the database state using safe, read-only `SELECT` queries via `psql`.

3. **Strict Read-Only Enforcement:**
   - NEVER use tools like `edit` or `write` while in Plan Mode.
   - NEVER run state-modifying bash commands (e.g., no `rm`, `sed`, `git commit`, `UPDATE`, `INSERT`, etc.).

4. **Propose a Clear, Actionable Plan:**
   - Outline the exact files you intend to modify.
   - Briefly describe the logical changes or additions for each file.
   - Highlight any potential side-effects or edge cases.
   - Explicitly stop and ask the user: *"Does this plan look good? Let me know if I should switch to Build Mode to implement this."*
