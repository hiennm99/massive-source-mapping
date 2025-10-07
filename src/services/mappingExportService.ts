// File: src/services/mappingExportService.ts - UPDATED FOR BACKEND COMPATIBILITY
import { toast } from 'sonner';
import type {MappingExportResponse, MappingSource, MappingExportData, ApiError} from "../types";

// Backend config
const BACKEND_URL = 'https://massive-source-mapping-backend-production-b621.up.railway.app';
// const BACKEND_URL = 'http://localhost:8000';
const API_ENDPOINTS = {
    mappings: `${BACKEND_URL}/api/mapping-exports`,
    health: `${BACKEND_URL}/`,
    stats: `${BACKEND_URL}/api/mapping-exports/stats`,
    search: `${BACKEND_URL}/api/mapping-exports/search`,
    batch: `${BACKEND_URL}/api/mapping-exports/batch`
};

const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

// Validate MappingSource structure to match backend expectations
const validateMappingSource = (source: unknown): MappingSource => {
    if (!source || typeof source !== 'object') {
        throw new Error('Invalid mapping source structure - must be an object');
    }

    // Check for required fields and ensure they have meaningful values
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const file = typeof source.file === 'string' ? source.file.trim() : '';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const sheet = typeof source.sheet === 'string' ? source.sheet.trim() : '';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const column = typeof source.column === 'string' ? source.column.trim() : '';

    // Validate required fields are not empty
    if (!file || !sheet || !column) {
        throw new Error(`Invalid mapping source - missing required fields: file="${file}", sheet="${sheet}", column="${column}"`);
    }

    // Return plain object - no class instances
    return {
        file,
        sheet,
        column
    };
};

// Validate array mappings with strict backend format compliance
const validateArrayMappings = (data: unknown): Array<{[key: string]: MappingSource}> => {
    if (!data || !Array.isArray(data)) {
        console.warn('Array mappings data is not an array, returning empty array');
        return [];
    }

    const validMappings: Array<{[key: string]: MappingSource}> = [];

    data.forEach((item, index) => {
        try {
            if (!item || typeof item !== 'object') {
                console.warn(`Invalid array mapping item at index ${index} - not an object`);
                return;
            }

            const validItem: {[key: string]: MappingSource} = {};
            let hasValidMapping = false;

            for (const [key, value] of Object.entries(item)) {
                try {
                    const validSource = validateMappingSource(value);
                    validItem[key] = validSource;
                    hasValidMapping = true;
                } catch (error) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    console.warn(`Invalid mapping source at index ${index}, key ${key}:`, error.message);
                }
            }

            if (hasValidMapping && Object.keys(validItem).length > 0) {
                validMappings.push(validItem);
            } else {
                console.warn(`Skipping array mapping item at index ${index} - no valid mappings found`);
            }
        } catch (error) {
            console.warn(`Error processing array mapping item at index ${index}:`, error);
        }
    });

    return validMappings;
};

// Validate mapping data with strict backend compatibility
const validateMappingData = (data: MappingExportData): MappingExportData => {
    if (!data) {
        throw new Error('Data is required');
    }

    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        throw new Error('Name is required and must be a non-empty string');
    }

    if (!data.mappings || typeof data.mappings !== 'object') {
        throw new Error('Mappings are required and must be an object');
    }

    // Validate mappings structure with backend expectations
    const validatedMappings: {[key: string]: MappingSource | Array<{[key: string]: MappingSource}>} = {};
    let hasValidMappings = false;

    for (const [key, value] of Object.entries(data.mappings)) {
        try {
            if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                // These should be arrays
                const validatedArray = validateArrayMappings(value);
                if (validatedArray.length > 0) {
                    validatedMappings[key] = validatedArray;
                    hasValidMappings = true;
                } else {
                    console.warn(`Skipping empty ${key} array`);
                }
            } else {
                // Regular mappings should be MappingSource objects
                try {
                    const validatedSource = validateMappingSource(value);
                    validatedMappings[key] = validatedSource;
                    hasValidMappings = true;
                } catch (error) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    console.warn(`Skipping invalid mapping for key "${key}":`, error.message);
                }
            }
        } catch (error) {
            console.warn(`Error processing mapping for key "${key}":`, error);
        }
    }

    if (!hasValidMappings) {
        throw new Error('No valid mappings found - all mappings have missing or empty required fields (file, sheet, column)');
    }

    return {
        name: data.name.trim(),
        mappings: validatedMappings
    };
};

// Validate backend connection
export const testBackendConnection = async (): Promise<boolean> => {
    try {
        const response = await fetch(API_ENDPOINTS.health, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.message && data.message.includes('running');
    } catch (error) {
        console.error('Backend connection test failed:', error);
        return false;
    }
};

// Save mapping export with backend compatibility
export const saveMappingExport = async (data: MappingExportData): Promise<MappingExportResponse> => {
    try {
        // Validate and sanitize input data
        const validatedData = validateMappingData(data);

        console.log("Validated mapping export", validatedData);

        console.log('Sending validated payload to backend:', JSON.stringify(validatedData, null, 2));

        const response = await fetch(API_ENDPOINTS.mappings, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(validatedData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            let errorMessage = 'Unknown error';

            try {
                const errorText = await response.text();
                console.log('Error response text:', errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    console.log('Parsed error JSON:', errorJson);

                    if (errorJson.detail) {
                        if (typeof errorJson.detail === 'string') {
                            errorMessage = errorJson.detail;
                        } else if (Array.isArray(errorJson.detail)) {
                            // FastAPI validation errors format
                            const errorDetails = errorJson.detail.map((err: { string: string }) => err.string);
                            errorMessage = `Validation error: ${errorDetails}`;
                        } else {
                            errorMessage = JSON.stringify(errorJson.detail);
                        }
                    } else {
                        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
                    }
                } 
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                catch (parseError) {
                    errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
                }
            } catch (textError) {
                console.error('Could not read response text:', textError);
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }

            throw new Error(`Failed to save mapping: ${errorMessage}`);
        }

        const result: MappingExportResponse = await response.json();
        console.log('Success response:', result);
        toast.success('Saved mapping successfully!');
        return result;
    } catch (error) {
        console.error('Save mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving mapping. Please try again.';
        toast.error(errorMessage);
        throw error;
    }
};

// Get mapping exports
export const getMappingExports = async (skip: number = 0, limit: number = 100): Promise<MappingExportResponse[]> => {
    try {
        const url = `${API_ENDPOINTS.mappings}?skip=${skip}&limit=${limit}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: ApiError = await response.json();
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}: ${response.statusText}`;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to fetch mappings: ${errorMessage}`);
        }

        const data: MappingExportResponse[] = await response.json();
        return data;
    } catch (error) {
        console.error('Get mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching mappings. Please try again.';
        toast.error(errorMessage);
        throw error;
    }
};

// Delete mapping export
export const deleteMappingExport = async (id: string): Promise<void> => {
    try {
        if (!id || !id.trim()) {
            throw new Error('Record ID is required');
        }

        const response = await fetch(`${API_ENDPOINTS.mappings}/${id}`, {
            method: 'DELETE',
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: ApiError = await response.json();
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}: ${response.statusText}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to delete mapping: ${errorMessage}`);
        }

        toast.success('Deleted mapping successfully!');
    } catch (error) {
        console.error('Delete mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting mapping. Please try again.';
        toast.error(errorMessage);
        throw error;
    }
};

// Batch delete mapping exports
export const deleteMappingExports = async (ids: string[]): Promise<void> => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error('At least one record ID is required');
        }

        const response = await fetch(API_ENDPOINTS.batch, {
            method: 'DELETE',
            headers: headers,
            body: JSON.stringify(ids)
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: ApiError = await response.json();
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}: ${response.statusText}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to delete mappings: ${errorMessage}`);
        }

        const result = await response.json();
        if (result.success) {
            toast.success(`Deleted ${result.deleted_count} mappings successfully!`);
        } else {
            toast.warning(`Deleted ${result.deleted_count} mappings, ${result.error_count} errors occurred.`);
        }
    } catch (error) {
        console.error('Batch delete mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting mappings. Please try again.';
        toast.error(errorMessage);
        throw error;
    }
};

// Get mapping export by ID
export const getMappingExportById = async (id: string): Promise<MappingExportResponse> => {
    try {
        if (!id || !id.trim()) {
            throw new Error('Record ID is required');
        }

        const response = await fetch(`${API_ENDPOINTS.mappings}/${id}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: ApiError = await response.json();
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}: ${response.statusText}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to fetch mapping: ${errorMessage}`);
        }

        const data: MappingExportResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Get mapping export by ID error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching mapping. Please try again.';
        toast.error(errorMessage);
        throw error;
    }
};

// Update mapping export with backend compatibility
export const updateMappingExport = async (
    id: string,
    data: {
        name?: string;
        mappings?: {[key: string]: MappingSource | Array<{[key: string]: MappingSource}>};
    }
): Promise<MappingExportResponse> => {
    try {
        if (!id || !id.trim()) {
            throw new Error('Record ID is required');
        }

        // Only include non-empty fields in the update
        const payload: { [key: string]: unknown } = {};

        if (data.name && data.name.trim()) {
            payload.name = data.name.trim();
        }

        if (data.mappings !== undefined) {
            // Validate mappings structure
            const validatedMappings: {[key: string]: MappingSource | Array<{[key: string]: MappingSource}>} = {};
            let hasValidMappings = false;

            for (const [key, value] of Object.entries(data.mappings)) {
                try {
                    if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                        const validatedArray = validateArrayMappings(value);
                        if (validatedArray.length > 0) {
                            validatedMappings[key] = validatedArray;
                            hasValidMappings = true;
                        }
                    } else {
                        const validatedSource = validateMappingSource(value);
                        validatedMappings[key] = validatedSource;
                        hasValidMappings = true;
                    }
                } catch (error) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    console.warn(`Skipping invalid mapping for key "${key}":`, error.message);
                }
            }

            if (hasValidMappings) {
                payload.mappings = validatedMappings;
            } else {
                throw new Error('No valid mappings found for update');
            }
        }

        if (Object.keys(payload).length === 0) {
            throw new Error('No valid data to update');
        }

        const response = await fetch(`${API_ENDPOINTS.mappings}/${id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: ApiError = await response.json();
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}: ${response.statusText}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to update mapping: ${errorMessage}`);
        }

        const result: MappingExportResponse = await response.json();
        toast.success('Updated mapping successfully!');
        return result;
    } catch (error) {
        console.error('Update mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating mapping. Please try again.';
        toast.error(errorMessage);
        throw error;
    }
};

// Search mapping exports
export const searchMappingExports = async (
    query: string,
    skip: number = 0,
    limit: number = 100
): Promise<MappingExportResponse[]> => {
    try {
        const url = `${API_ENDPOINTS.search}?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: ApiError = await response.json();
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}: ${response.statusText}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to search mappings: ${errorMessage}`);
        }

        const data: MappingExportResponse[] = await response.json();
        return data;
    } catch (error) {
        console.error('Search mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while searching mappings. Please try again.';
        toast.error(errorMessage);
        throw error;
    }
};

// Get mapping statistics
export const getMappingStats = async (): Promise<{
    total_mappings: number;
    timestamp: string;
}> => {
    try {
        const response = await fetch(API_ENDPOINTS.stats, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Get mapping stats failed:', error);
        return {
            total_mappings: 0,
            timestamp: new Date().toISOString()
        };
    }
};

// Health check utility
export const checkBackendHealth = async (): Promise<{
    status: 'healthy' | 'unhealthy';
    message?: string;
    timestamp: string;
}> => {
    try {
        const response = await fetch(API_ENDPOINTS.health, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            status: 'healthy',
            message: data.message,
            timestamp: data.timestamp
        };
    } catch (error) {
        console.error('Backend health check failed:', error);
        return {
            status: 'unhealthy',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
};

// Utility function to format dates
export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return dateString;
    }
};

// Export type definitions for use in other files
export type {
    MappingSource,
    MappingExportData,
    MappingExportResponse
};

// Export all functions as default object for backward compatibility
export default {
    saveMappingExport,
    getMappingExports,
    deleteMappingExport,
    deleteMappingExports,
    getMappingExportById,
    updateMappingExport,
    searchMappingExports,
    getMappingStats,
    testBackendConnection,
    checkBackendHealth,
    formatDate
};