# Path Aliases Configuration

This document describes the path aliases configured for this project to simplify imports.

## Available Aliases

| Alias         | Maps to                | Description                         |
| ------------- | ---------------------- | ----------------------------------- |
| `$types`      | `src/types/*`          | TypeScript type definitions         |
| `$services`   | `src/services/*`       | API services and clients            |
| `$lib`        | `src/lib/*`            | Library utilities and shared code   |
| `$components` | `src/lib/components/*` | React components                    |
| `$hooks`      | `src/lib/hooks/*`      | Custom React hooks                  |
| `$assets`     | `src/assets/*`         | Static assets (images, fonts, etc.) |

## Usage Examples

### Before (Relative Paths)

```typescript
// From src/lib/components/workflows/WorkflowDashboard.tsx
import type { ExecutionRecord, Schedule } from "../../../types/workflow";
import { workflowApi } from "../../../services/workflowApi";
import { ActionButton } from "./common";
```

### After (Path Aliases)

```typescript
import type { ExecutionRecord, Schedule } from "$types/workflow";
import { workflowApi } from "$services/workflowApi";
import { ActionButton } from "$components/workflows/common";
```

## Configuration Files

- **TypeScript**: `tsconfig.app.json` - `compilerOptions.paths`
- **Vite**: `vite.config.ts` - `resolve.alias`

## Benefits

1. **Cleaner imports**: No more counting `../` levels
2. **Easier refactoring**: Files can be moved without breaking imports
3. **Better IDE support**: Autocomplete works seamlessly
4. **Consistent imports**: Always use the same alias regardless of file location
