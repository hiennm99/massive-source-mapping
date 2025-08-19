// File: src/services/mappingExportService.ts
import { toast } from 'sonner';

// Type definitions matching the new backend structure
interface SourceData {
    path: string;
    value: string;
    type: string;
    file?: string;
    sheet?: string;
}

interface DestinationData {
    table: string;
    column: string;
}

interface MappingItem {
    id: number;
    source: SourceData;
    destination: DestinationData;
}

interface DestinationTable {
    id: string;
    name: string;
    columns: string[];
}

interface MappingExportData {
    name: string;
    mappings: MappingItem[];
    destination_tables: DestinationTable[];
}

interface MappingExportResponse {
    id: string;
    name: string;
    mappings: MappingItem[];
    destination_tables: DestinationTable[];
    created_at: string;
    updated_at: string;
}

interface ApiError {
    detail: string | any[];
}

// Backend config
const BACKEND_URL = 'https://massive-source-mapping-backend-production.up.railway.app';
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

// Validate SourceData structure
const validateSourceData = (source: any): SourceData => {
    if (!source || typeof source !== 'object') {
        throw new Error('Invalid source data structure');
    }

    return {
        path: source.path || '',
        value: source.value || '',
        type: source.type || 'column',
        file: source.file,
        sheet: source.sheet
    };
};

// Validate DestinationData structure
const validateDestinationData = (destination: any): DestinationData => {
    if (!destination || typeof destination !== 'object') {
        throw new Error('Invalid destination data structure');
    }

    return {
        table: destination.table || '',
        column: destination.column || ''
    };
};

// Validate MappingItem structure
const validateMappingItem = (item: any): MappingItem => {
    if (!item || typeof item !== 'object') {
        throw new Error('Invalid mapping item structure');
    }

    return {
        id: typeof item.id === 'number' ? item.id : Date.now(),
        source: validateSourceData(item.source),
        destination: validateDestinationData(item.destination)
    };
};

// Validate DestinationTable structure
const validateDestinationTable = (table: any): DestinationTable => {
    if (!table || typeof table !== 'object') {
        throw new Error('Invalid destination table structure');
    }

    return {
        id: table.id || `table_${Date.now()}`,
        name: table.name || '',
        columns: Array.isArray(table.columns) ? table.columns : []
    };
};

// Sanitize mappings to ensure it's a valid array of MappingItems
const sanitizeMappings = (data: any): MappingItem[] => {
    if (!data || !Array.isArray(data)) {
        console.warn('Mappings data is not an array, returning empty array');
        return [];
    }

    const validMappings: MappingItem[] = [];

    data.forEach((item, index) => {
        try {
            const validMapping = validateMappingItem(item);
            validMappings.push(validMapping);
        } catch (error) {
            console.warn(`Invalid mapping item at index ${index}:`, error);
            // Skip invalid items rather than failing completely
        }
    });

    return validMappings;
};

// Sanitize destination tables to ensure it's a valid array of DestinationTables
const sanitizeDestinationTables = (data: any): DestinationTable[] => {
    if (!data || !Array.isArray(data)) {
        console.warn('Destination tables data is not an array, returning empty array');
        return [];
    }

    const validTables: DestinationTable[] = [];

    data.forEach((table, index) => {
        try {
            const validTable = validateDestinationTable(table);
            validTables.push(validTable);
        } catch (error) {
            console.warn(`Invalid destination table at index ${index}:`, error);
            // Skip invalid items rather than failing completely
        }
    });

    return validTables;
};

// Validate mapping data before sending to backend
const validateMappingData = (data: MappingExportData): MappingExportData => {
    if (!data) {
        throw new Error('Data is required');
    }

    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        throw new Error('Name is required and must be a non-empty string');
    }

    // Sanitize and validate mappings and destination_tables
    const sanitizedMappings = sanitizeMappings(data.mappings);
    const sanitizedDestinationTables = sanitizeDestinationTables(data.destination_tables);

    if (sanitizedMappings.length === 0) {
        throw new Error('At least one valid mapping is required');
    }

    if (sanitizedDestinationTables.length === 0) {
        throw new Error('At least one valid destination table is required');
    }

    console.log('Original mappings:', data.mappings);
    console.log('Sanitized mappings:', sanitizedMappings);
    console.log('Original destination_tables:', data.destination_tables);
    console.log('Sanitized destination_tables:', sanitizedDestinationTables);

    return {
        name: data.name.trim(),
        mappings: sanitizedMappings,
        destination_tables: sanitizedDestinationTables
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

// Save mapping export - accepting both MappingItem[] and ColumnMapping[] (they're the same type)
export const saveMappingExport = async (data: {
    name: string;
    mappings: MappingItem[];
    destination_tables: DestinationTable[]
}): Promise<MappingExportResponse> => {
    try {
        // Validate and sanitize input data
        const validatedData = validateMappingData(data);

        const payload = {
            name: validatedData.name,
            mappings: validatedData.mappings,
            destination_tables: validatedData.destination_tables
        };

        console.log('Sending payload to backend:', JSON.stringify(payload, null, 2));

        const response = await fetch(API_ENDPOINTS.mappings, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            let errorDetails = '';

            try {
                const errorText = await response.text();
                console.log('Error response text:', errorText);

                // Try to parse as JSON
                try {
                    const errorJson = JSON.parse(errorText);
                    console.log('Parsed error JSON:', errorJson);

                    if (errorJson.detail) {
                        if (typeof errorJson.detail === 'string') {
                            errorMessage = errorJson.detail;
                        } else if (Array.isArray(errorJson.detail)) {
                            // FastAPI validation errors format
                            errorDetails = errorJson.detail.map((err: any) =>
                                `${err.loc?.join('.')} - ${err.msg}`
                            ).join('; ');
                            errorMessage = `Validation error: ${errorDetails}`;
                        } else {
                            errorMessage = JSON.stringify(errorJson.detail);
                        }
                    } else {
                        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
                    }
                } catch (parseError) {
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
        toast.success('Saved mapping successfully !!!');
        return result;
    } catch (error) {
        console.error('Save mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu mapping. Vui lòng thử lại.';
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
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to fetch mappings: ${errorMessage}`);
        }

        const data: MappingExportResponse[] = await response.json();

        // Validate response data structure
        const validatedData = data.map(item => ({
            ...item,
            mappings: sanitizeMappings(item.mappings),
            destination_tables: sanitizeDestinationTables(item.destination_tables)
        }));

        return validatedData;
    } catch (error) {
        console.error('Get mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách mapping. Vui lòng thử lại.';
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
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to delete mapping: ${errorMessage}`);
        }

        toast.success('Đã xóa mapping thành công!');
    } catch (error) {
        console.error('Delete mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa mapping. Vui lòng thử lại.';
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
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to delete mappings: ${errorMessage}`);
        }

        const result = await response.json();
        if (result.success) {
            toast.success(`Đã xóa ${result.deleted_count} mapping thành công!`);
        } else {
            toast.warning(`Đã xóa ${result.deleted_count} mapping, có ${result.error_count} lỗi.`);
        }
    } catch (error) {
        console.error('Batch delete mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa mappings. Vui lòng thử lại.';
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
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to fetch mapping: ${errorMessage}`);
        }

        const data: MappingExportResponse = await response.json();

        // Validate response data structure
        const validatedData = {
            ...data,
            mappings: sanitizeMappings(data.mappings),
            destination_tables: sanitizeDestinationTables(data.destination_tables)
        };

        return validatedData;
    } catch (error) {
        console.error('Get mapping export by ID error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải mapping. Vui lòng thử lại.';
        toast.error(errorMessage);
        throw error;
    }
};

// Update mapping export
export const updateMappingExport = async (
    id: string,
    data: {
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
        mappings?: MappingItem[];
        destination_tables?: DestinationTable[]
    }
): Promise<MappingExportResponse> => {
    try {
        if (!id || !id.trim()) {
            throw new Error('Record ID is required');
        }

        // Only include non-empty fields in the update
        const payload: any = {};

        if (data.name && data.name.trim()) {
            payload.name = data.name.trim();
        }

        if (data.mappings !== undefined) {
            payload.mappings = sanitizeMappings(data.mappings);
        }

        if (data.destination_tables !== undefined) {
            payload.destination_tables = sanitizeDestinationTables(data.destination_tables);
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
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to update mapping: ${errorMessage}`);
        }

        const result: MappingExportResponse = await response.json();
        toast.success('Cập nhật mapping thành công!');
        return result;
    } catch (error) {
        console.error('Update mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật mapping. Vui lòng thử lại.';
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

        // Validate response data structure
        const validatedData = data.map(item => ({
            ...item,
            mappings: sanitizeMappings(item.mappings),
            destination_tables: sanitizeDestinationTables(item.destination_tables)
        }));

        return validatedData;
    } catch (error) {
        console.error('Search mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tìm kiếm mapping. Vui lòng thử lại.';
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
        return date.toLocaleString('vi-VN', {
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
    SourceData,
    DestinationData,
    MappingItem,
    DestinationTable,
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