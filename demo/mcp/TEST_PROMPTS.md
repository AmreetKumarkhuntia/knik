# Test Prompts for File Operations MCP Tools

Use these prompts in the console app to test the new file operation tools:

## Basic Tests

### 1. Read File
```
Read the README.md file and tell me what the project is about.
```

### 2. Read File with Line Range
```
Read lines 1 to 10 of the README.md file.
```

### 3. List Directory
```
List all files in the docs directory.
```

### 4. List Directory Recursively
```
List all markdown files in the docs directory recursively.
```

### 5. File Info
```
Get information about the README.md file - size, lines, modification date.
```

## Search Tests

### 6. Search in Files
```
Search for the word "MCP" in all markdown files in the docs directory.
```

### 7. Find in Specific File
```
Find all occurrences of "AI" in the README.md file with 2 lines of context.
```

### 8. Count Occurrences
```
Count how many times the word "the" appears (case-insensitive) in README.md.
```

### 9. Regex Search
```
Find all version numbers (like 1.5 or 82.0) in the README.md file using regex pattern \b\d+\.\d+\b
```

## Advanced Tests

### 10. Documentation Audit (Multi-step)
```
I need you to audit the docs directory:
1. List all markdown files
2. For each file, get the line count
3. Search for any TODO or FIXME markers
4. Create a summary report
```

### 11. Code Analysis
```
Analyze the src/lib/mcp/implementations/file_impl.py file:
1. Count total lines
2. Find all function definitions (search for "def ")
3. Count how many helper functions start with underscore
4. Give me a summary
```

### 12. Project Statistics
```
Give me statistics about this project:
1. Count total Python files in src/
2. Find files with "test" in the name
3. Count total lines of code in src/lib/
```

## Error Handling Tests

### 13. Non-existent File
```
Read the file "nonexistent.txt"
```

### 14. Invalid Line Range
```
Read lines 1000 to 2000 from README.md (should fail gracefully)
```

## Expected Tool Usage

When you ask these questions, the AI should:
- Use `read_file` for reading file contents
- Use `list_directory` for listing files/folders
- Use `search_in_files` for multi-file searches
- Use `find_in_file` for single-file searches with context
- Use `count_in_file` for counting occurrences
- Use `file_info` for metadata

## Tips

- Start with simple tests (1-5) to verify basic functionality
- Try complex multi-step tasks (10-12) to test reasoning
- Check error handling (13-14) for robustness
- Enable debug mode (`/debug on`) to see which tools are being called
