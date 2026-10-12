# Path Aliases Configuration

This document describes the path aliases configured for the Knik frontend to simplify imports.

## Available Aliases

| Alias         | Maps to                | Description                                         | Usage      |
| ------------- | ---------------------- | --------------------------------------------------- | ---------- |
| `$types`      | `src/types/*`          | TypeScript type definitions                         | ~179 files |
| `$lib`        | `src/lib/*`            | Library root: data structures, constants, etc.      | ~52 files  |
| `$components` | `src/lib/components/*` | Reusable UI components                              | ~77 files  |
| `$stores`     | `src/lib/stores/*`     | Zustand domain stores and joined views              | ~47 files  |
| `$widgets`    | `src/lib/widgets/*`    | Widgets that bind stores to components              | ~28 files  |
| `$pages`      | `src/lib/pages/*`      | Top-level page components                           | ~3 files   |
| `$utils`      | `src/lib/utils/*`      | Utility functions                                   | ~18 files  |
| `$constants`  | `src/lib/constants/*`  | Constants and config values                         | unused     |
| `$hooks`      | `src/lib/hooks/*`      | Shared browser hooks (viewport, keyboard shortcuts) | ~6 files   |

> **Note:** `$constants` is configured but unused; code imports constants through `$lib/constants`.

## Usage Examples

### Before (Relative Paths)

```typescript
// From src/lib/widgets/workflows/WorkflowHubWidget.tsx
import type { ExecutionDetail, Schedule } from "../../../types/workflow";
import { useWorkflowHubView } from "../../stores/views";
import HistoryTable from "../../components/workflows/HistoryTable";
```

### After (Path Aliases)

```typescript
import type { ExecutionDetail, Schedule } from "$types/workflow";
import { useWorkflowHubView } from "$stores/views";
import HistoryTable from "$components/workflows/HistoryTable";
```

### Common Import Patterns

```typescript
// Types (most common alias)
import type { WorkflowDefinition, ExecutionStatus } from "$types/workflow";
import type { Conversation } from "$types/conversation";

// Components
import Button from "$components/buttons/Button";
import Table from "$components/display/Table";
import Modal from "$components/surfaces/Modal";

// Stores and widgets
import { useFeedbackStore } from "$stores/feedback";
import FormRow from "$widgets/FormRow";

// Library utilities and sub-paths
import { formatDuration } from "$utils/format";
import { NODE_REGISTRY } from "$lib/constants/nodes";
import { Graph } from "$lib/data-structures";

// Hooks
import { useViewport } from "$hooks";

// Pages (used in App.tsx router)
import { Home, Workflows, WorkflowBuilder } from "$pages";
```

## Configuration Files

### TypeScript (`tsconfig.app.json`)

Path aliases are defined in `compilerOptions.paths`, each as a bare alias plus a `/*` glob:

```json
{
  "compilerOptions": {
    "paths": {
      "$types": ["./src/types"],
      "$types/*": ["./src/types/*"],
      "$lib": ["./src/lib"],
      "$lib/*": ["./src/lib/*"],
      "$components": ["./src/lib/components"],
      "$components/*": ["./src/lib/components/*"],
      "$stores": ["./src/lib/stores"],
      "$stores/*": ["./src/lib/stores/*"],
      "$widgets": ["./src/lib/widgets"],
      "$widgets/*": ["./src/lib/widgets/*"],
      "$pages": ["./src/lib/pages"],
      "$pages/*": ["./src/lib/pages/*"],
      "$utils": ["./src/lib/utils"],
      "$utils/*": ["./src/lib/utils/*"],
      "$constants": ["./src/lib/constants"],
      "$constants/*": ["./src/lib/constants/*"],
      "$hooks": ["./src/lib/hooks"],
      "$hooks/*": ["./src/lib/hooks/*"]
    }
  }
}
```

### Vite (`vite.config.ts`)

Aliases are mirrored in `resolve.alias` using `path.resolve()`:

```typescript
resolve: {
  alias: {
    $types: path.resolve(__dirname, "./src/types"),
    $lib: path.resolve(__dirname, "./src/lib"),
    $components: path.resolve(__dirname, "./src/lib/components"),
    $stores: path.resolve(__dirname, "./src/lib/stores"),
    $widgets: path.resolve(__dirname, "./src/lib/widgets"),
    $pages: path.resolve(__dirname, "./src/lib/pages"),
    $hooks: path.resolve(__dirname, "./src/lib/hooks"),
    $utils: path.resolve(__dirname, "./src/lib/utils"),
    $constants: path.resolve(__dirname, "./src/lib/constants"),
  }
}
```

Both files must stay in sync. If you add an alias, update both `tsconfig.app.json` and `vite.config.ts`.

## Benefits

1. **Cleaner imports** -- no more counting `../` levels
2. **Easier refactoring** -- files can be moved without breaking imports
3. **Better IDE support** -- autocomplete works seamlessly with both configs
4. **Consistent imports** -- always use the same alias regardless of file location
