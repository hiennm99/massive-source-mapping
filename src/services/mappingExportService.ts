// File: src/services/mappingExportService.ts
import { toast } from 'sonner';
import type {MappingExportResponse, MappingSource, MappingExportData, ApiError} from "../types";
import { COLUMN_GROUPS } from '../config/columnGroups';

// Backend config
const BACKEND_URL = 'https://massive-source-mapping-backend-production-b621.up.railway.app';
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

// Get all group keys for validation
const GROUP_KEYS = COLUMN_GROUPS.map(g => g.key);

// Validate MappingSource - Return null if any field is missing (backend requirement)
const validateMappingSource = (source: unknown): MappingSource | null => {
    if (!source || typeof source !== 'object') {
        return null;
    }

    const file = typeof (source as any).file === 'string' ? (source as any).file.trim() : '';
    const sheet = typeof (source as any).sheet === 'string' ? (source as any).sheet.trim() : '';
    const column = typeof (source as any).column === 'string' ? (source as any).column.trim() : '';

    // Backend requires ALL 3 fields to be non-empty
    if (!file || !sheet || !column) {
        return null;
    }

    return { file, sheet, column };
};

// Validate object mappings (for base group) - Filter out incomplete mappings
const validateObjectMappings = (data: unknown): {[key: string]: MappingSource} => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }

    const validMappings: {[key: string]: MappingSource} = {};

    for (const [key, value] of Object.entries(data)) {
        const validSource = validateMappingSource(value);
        if (validSource) {
            validMappings[key] = validSource;
        }
    }

    return validMappings;
};

// Validate array mappings (for group arrays) - Filter out incomplete mappings
const validateArrayMappings = (data: unknown): Array<{[key: string]: MappingSource}> => {
    if (!data || !Array.isArray(data)) {
        return [];
    }

    const validMappings: Array<{[key: string]: MappingSource}> = [];

    data.forEach((item) => {
        if (!item || typeof item !== 'object') {
            return;
        }

        const validItem: {[key: string]: MappingSource} = {};

        for (const [key, value] of Object.entries(item)) {
            const validSource = validateMappingSource(value);
            if (validSource) {
                validItem[key] = validSource;
            }
        }

        // Only add instance if it has at least one complete mapping
        if (Object.keys(validItem).length > 0) {
            validMappings.push(validItem);
        }
    });

    return validMappings;
};

// Validate mapping data - Clean up before sending to backend
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

    const validatedMappings: {[key: string]: any} = {};

    for (const [key, value] of Object.entries(data.mappings)) {
        if (key === 'base') {
            const validatedBase = validateObjectMappings(value);
            if (Object.keys(validatedBase).length > 0) {
                validatedMappings[key] = validatedBase;
            }
        } else if (GROUP_KEYS.includes(key)) {
            const validatedArray = validateArrayMappings(value);
            if (validatedArray.length > 0) {
                validatedMappings[key] = validatedArray;
            }
        }
    }

    if (Object.keys(validatedMappings).length === 0) {
        throw new Error('No valid mappings found - all mappings are incomplete (missing file, sheet, or column)');
    }

    return {
        name: data.name.trim(),
        mappings: validatedMappings
    };
};

// Save mapping export
export const saveMappingExport = async (data: MappingExportData): Promise<MappingExportResponse> => {
    try {
        console.log('=== RAW INPUT DATA ===');
        console.log(JSON.stringify(data, null, 2));

        const validatedData = validateMappingData(data);

        console.log('=== CLEANED DATA (sending to backend) ===');
        console.log(JSON.stringify(validatedData, null, 2));

        const response = await fetch(API_ENDPOINTS.mappings, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(validatedData)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('=== BACKEND ERROR ===');
            console.error('Status:', response.status);
            console.error('Response:', errorText);

            let errorMessage = 'Unknown error';
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.detail) {
                    if (typeof errorJson.detail === 'string') {
                        errorMessage = errorJson.detail;
                    } else if (Array.isArray(errorJson.detail)) {
                        errorMessage = errorJson.detail.map((err: any) =>
                            `${err.loc ? err.loc.join('.') : ''}: ${err.msg || JSON.stringify(err)}`
                        ).join('; ');
                    } else {
                        errorMessage = JSON.stringify(errorJson.detail);
                    }
                } else {
                    errorMessage = errorText || `HTTP ${response.status}`;
                }
            } catch {
                errorMessage = errorText || `HTTP ${response.status}`;
            }

            throw new Error(`Failed to save mapping: ${errorMessage}`);
        }

        const result: MappingExportResponse = await response.json();
        console.log('✅ Success:', result);
        toast.success('Saved mapping successfully!');
        return result;
    } catch (error) {
        console.error('Save mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving mapping';
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
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}`;
            }
            throw new Error(`Failed to fetch mappings: ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Get mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching mappings';
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
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}`;
            }
            throw new Error(`Failed to delete mapping: ${errorMessage}`);
        }

        toast.success('Deleted mapping successfully!');
    } catch (error) {
        console.error('Delete mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting mapping';
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
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}`;
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
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting mappings';
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
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}`;
            }
            throw new Error(`Failed to fetch mapping: ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Get mapping export by ID error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching mapping';
        toast.error(errorMessage);
        throw error;
    }
};

// Update mapping export
export const updateMappingExport = async (
    id: string,
    data: {
        name?: string;
        mappings?: {[key: string]: any};
    }
): Promise<MappingExportResponse> => {
    try {
        if (!id || !id.trim()) {
            throw new Error('Record ID is required');
        }

        const payload: { [key: string]: unknown } = {};

        if (data.name && data.name.trim()) {
            payload.name = data.name.trim();
        }

        if (data.mappings !== undefined) {
            const validatedMappings: {[key: string]: any} = {};

            for (const [key, value] of Object.entries(data.mappings)) {
                if (key === 'base') {
                    const validatedBase = validateObjectMappings(value);
                    if (Object.keys(validatedBase).length > 0) {
                        validatedMappings[key] = validatedBase;
                    }
                } else if (GROUP_KEYS.includes(key)) {
                    const validatedArray = validateArrayMappings(value);
                    if (validatedArray.length > 0) {
                        validatedMappings[key] = validatedArray;
                    }
                }
            }

            if (Object.keys(validatedMappings).length > 0) {
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
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}`;
            }
            throw new Error(`Failed to update mapping: ${errorMessage}`);
        }

        const result: MappingExportResponse = await response.json();
        toast.success('Updated mapping successfully!');
        return result;
    } catch (error) {
        console.error('Update mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating mapping';
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
                errorMessage = typeof error.detail === 'string' ? error.detail : `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}`;
            }
            throw new Error(`Failed to search mappings: ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Search mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while searching mappings';
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
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Get mapping stats failed:', error);
        return {
            total_mappings: 0,
            timestamp: new Date().toISOString()
        };
    }
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
            throw new Error(`HTTP ${response.status}`);
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

export type { MappingSource, MappingExportData, MappingExportResponse };

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