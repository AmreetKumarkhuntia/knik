# Path Aliases Configuration

This document describes the path aliases configured for the Knik frontend to simplify imports.

## Available Aliases

| Alias         | Maps to                | Description                                          | Usage     |
| ------------- | ---------------------- | ---------------------------------------------------- | --------- |
| `$types`      | `src/types/*`          | TypeScript type definitions                          | ~97 files |
| `$lib`        | `src/lib/*`            | Library utilities, components, hooks                 | ~42 files |
| `$components` | `src/lib/components/*` | Reusable UI components                               | ~36 files |
| `$sections`   | `src/lib/sections/*`   | App-specific section components                      | ~13 files |
| `$services`   | `src/services/*`       | API services and clients                             | ~7 files  |
| `$hooks`      | `src/lib/hooks/*`      | Custom React hooks                                   | ~4 files  |
| `$store`      | `src/store/*`          | Zustand state management (audio, chat, toast slices) | ~4 files  |
| `$pages`      | `src/lib/pages/*`      | Top-level page components                            | ~1 file   |
| `$common`     | `src/lib/components/*` | Alias for components (same as above)                 | unused    |
| `$utils`      | `src/lib/utils/*`      | Utility functions                                    | unused    |
| `$constants`  | `src/lib/constants/*`  | Constants and config values                          | unused    |
| `$assets`     | `src/assets/*`         | Static assets (images, fonts, etc.)                  | unused    |

> **Note:** `$common`, `$utils`, `$constants`, and `$assets` are configured but currently unused in the codebase. `$utils` and `$constants` are redundant with `$lib/utils` and `$lib/constants` which are used instead.

## Usage Examples

### Before (Relative Paths)

```typescript
// From src/lib/sections/workflows/WorkflowHub.tsx
import type { ExecutionRecord, Schedule } from "../../../types/workflow";
import { workflowApi } from "../../../services/workflowApi";
import { ActionButton } from "../../components/ActionButton";
```

### After (Path Aliases)

```typescript
import type { ExecutionRecord, Schedule } from "$types/workflow";
import { workflowApi } from "$services/workflowApi";
import ActionButton from "$components/ActionButton";
```

### Common Import Patterns

```typescript
// Types (most common alias)
import type { WorkflowDefinition, ExecutionStatus } from "$types/workflow";
import type { ChatMessage } from "$types/api";

// Components
import LoadingSpinner from "$components/LoadingSpinner";
import { Table } from "$components/Table";
import Modal from "$components/Modal";

// Sections (app-specific UI)
import { ChatPanel } from "$sections/chat/ChatPanel";
import { MainLayout } from "$sections/layout/MainLayout";
import { ThemeProvider } from "$sections/theme";

// Library utilities and sub-paths
import { formatDuration } from "$lib/utils/format";
import { NODE_TYPES } from "$lib/constants/nodes";
import { Graph } from "$lib/data-structures";

// Services
import { workflowApi } from "$services/workflowApi";
import { streamChat } from "$services/streaming";

// Hooks
import { useTheme } from "$hooks/useTheme";

// Pages (used in App.tsx router)
import { Home, Workflows, WorkflowBuilder } from "$pages/index";
```

## Configuration Files

### TypeScript (`tsconfig.app.json`)

Path aliases are defined in `compilerOptions.paths` with the `/*` glob suffix:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "$types/*": ["./src/types/*"],
      "$services/*": ["./src/services/*"],
      "$lib/*": ["./src/lib/*"],
      "$components/*": ["./src/lib/components/*"],
      "$sections/*": ["./src/lib/sections/*"],
      "$pages/*": ["./src/lib/pages/*"],
      "$common/*": ["./src/lib/components/*"],
      "$utils/*": ["./src/lib/utils/*"],
      "$constants/*": ["./src/lib/constants/*"],
      "$hooks/*": ["./src/lib/hooks/*"],
      "$store/*": ["./src/store/*"],
      "$assets/*": ["./src/assets/*"]
    }
  }
}
```

### Vite (`vite.config.ts`)

Aliases are mirrored in `resolve.alias` using `path.resolve()`:

```typescript
resolve: {
  alias: {
    "$types": path.resolve(__dirname, "./src/types"),
    "$services": path.resolve(__dirname, "./src/services"),
    "$lib": path.resolve(__dirname, "./src/lib"),
    "$components": path.resolve(__dirname, "./src/lib/components"),
    "$sections": path.resolve(__dirname, "./src/lib/sections"),
    "$pages": path.resolve(__dirname, "./src/lib/pages"),
    "$hooks": path.resolve(__dirname, "./src/lib/hooks"),
    "$store": path.resolve(__dirname, "./src/store"),
    "$assets": path.resolve(__dirname, "./src/assets"),
    "$common": path.resolve(__dirname, "./src/lib/components"),
    "$utils": path.resolve(__dirname, "./src/lib/utils"),
    "$constants": path.resolve(__dirname, "./src/lib/constants"),
  }
}
```

Both files must stay in sync. If you add an alias, update both `tsconfig.app.json` and `vite.config.ts`.

## Benefits

1. **Cleaner imports** -- no more counting `../` levels
2. **Easier refactoring** -- files can be moved without breaking imports
3. **Better IDE support** -- autocomplete works seamlessly with both configs
4. **Consistent imports** -- always use the same alias regardless of file location
