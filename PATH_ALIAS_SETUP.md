# @lib Path Alias Configuration

## Summary
Configured a path alias `@lib` for quick and clean imports of the shared library utilities.

## Configuration Files Updated

### 1. TypeScript Configuration
**File:** `tsconfig.app.json`
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@lib": ["src/lib"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

### 2. Vite Configuration
**File:** `vite.config.ts`
```typescript
resolve: {
  alias: {
    '@lib': '/src/lib',
  }
}
```

## Usage

### Before (Relative Path)
```typescript
import { apiClient, handleApiError, showSuccessToast } from '../../../lib';
```

### After (@lib Alias)
```typescript
import { apiClient, handleApiError, showSuccessToast } from '@lib';
```

## Files Using @lib Alias

1. `src/features/exports-manager/services/exportManagerService.ts`
2. `src/features/mapping/services/excelUploadService.ts`

## Library Structure

```
src/lib/
├── axiosClient.ts          # Centralized axios instance
└── index.ts                # Barrel export
```

### Exports from @lib
- `apiClient` - Configured axios instance
- `handleApiError()` - Unified error handling
- `showSuccessToast()` - Success notification helper

## Build Status
✓ Builds successfully
✓ TypeScript compilation passes
✓ Vite bundling works correctly

## Benefits

1. **Cleaner Imports**: No more counting `../../../` paths
2. **Maintainability**: Moving files doesn't break imports
3. **Consistency**: All library imports use the same pattern
4. **IDE Support**: Better autocomplete and path resolution
5. **Scalability**: Easy to add more path aliases as needed
