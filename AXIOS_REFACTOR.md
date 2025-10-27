# Axios Shared Client Refactoring

## Summary
Successfully created a shared axios client library for centralized API communication across the application.

## Changes Made

### 1. Created Shared Axios Client
**File:** `src/shared/api/axiosClient.ts`
- Centralized axios instance with common configuration
- Base URL: `https://massive-source-mapping-backend-production-b621.up.railway.app`
- Default timeout: 30 seconds
- Response interceptor for unified error handling
- Helper functions: `handleApiError()`, `showSuccessToast()`

### 2. Updated Export Manager Service
**File:** `src/features/exports-manager/services/exportManagerService.ts`
- Replaced all `fetch()` calls with `apiClient` methods
- Removed hardcoded BACKEND_URL and headers
- Updated API endpoints to use relative paths
- Simplified error handling using shared utilities
- Functions updated:
  - `saveMappingExport()` - POST
  - `getMappingExports()` - GET with params
  - `deleteMappingExport()` - DELETE
  - `deleteMappingExports()` - DELETE with data
  - `getMappingExportById()` - GET by ID
  - `updateMappingExport()` - PUT
  - `searchMappingExports()` - GET with query params
  - `getMappingStats()` - GET
  - `testBackendConnection()` - GET
  - `checkBackendHealth()` - GET

### 3. Updated Excel Upload Service
**File:** `src/features/mapping/services/excelUploadService.ts`
- Replaced all `fetch()` calls with `apiClient` methods
- Removed hardcoded BACKEND_URL
- Updated API endpoints to use relative paths
- Simplified error handling using shared utilities
- Functions updated:
  - `uploadAndScanExcelFile()` - POST with FormData
  - `uploadAndScanMultipleExcelFiles()` - POST with FormData

### 4. Updated Shared Exports
**File:** `src/shared/index.ts`
- Added API module exports to barrel file

## Benefits

1. **Centralized Configuration**: Single source of truth for API configuration
2. **Consistent Error Handling**: All errors go through the same interceptor
3. **Unified Toast Notifications**: Consistent user feedback across services
4. **Easier Maintenance**: Changes to API configuration only need to be made in one place
5. **Better Type Safety**: Axios provides better TypeScript support than fetch
6. **Request/Response Interceptors**: Can add authentication, logging, etc. in one place
7. **Timeout Management**: Centralized timeout configuration

## Installation

Axios was installed via npm:
```bash
npm install axios
```

## Usage Example

```typescript
import { apiClient, handleApiError, showSuccessToast } from '@/shared/api';

// GET request
const response = await apiClient.get<DataType>('/api/endpoint', {
    params: { key: 'value' }
});

// POST request
const response = await apiClient.post<DataType>('/api/endpoint', data);

// Error handling
try {
    await apiClient.get('/api/endpoint');
} catch (error) {
    handleApiError(error, 'Default error message');
}

// Success notification
showSuccessToast('Operation successful!');
```

## Future Enhancements

1. Add authentication token interceptor
2. Add request/response logging
3. Add retry logic for failed requests
4. Add request cancellation support
5. Add request rate limiting
