// File: src/services/mappingExportService.ts
import { toast } from 'sonner';

interface MappingExportData {
    name: string;
    mappings: [];
    destination_tables: [];
}

interface AirtableRecord {
    id: string;
    fields: {
        name: string;
        mappings: string; // JSON string
        destination_tables: string; // JSON string
        created_at: string;
    };
    createdTime: string;
}

interface AirtableResponse {
    records: AirtableRecord[];
    offset?: string;
}

interface AirtableError {
    error: {
        type: string;
        message: string;
    };
}

// Airtable config - Nên move vào environment variables
const BASE_ID = 'appn0kd4Lswsu3aIW';
const TABLE_NAME = 'mapping_exports';
const API_KEY = 'patyF7T5hiDjwyKZN.fc1a1ff04a6e5cee3711f74fcdd0390ae454a6f3899e7802d55a2138dd53a40a';
const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
};

// Validate required configs
const validateConfig = (): void => {
    if (!BASE_ID || !TABLE_NAME || !API_KEY) {
        throw new Error('Missing Airtable configuration. Please check your environment variables.');
    }
};

export const saveMappingExport = async (data: MappingExportData): Promise<unknown> => {
    try {
        validateConfig();

        // Validate input data
        if (!data.name || !data.name.trim()) {
            throw new Error('Mapping name is required');
        }

        const payload = {
            fields: {
                name: data.name.trim(),
                mappings: JSON.stringify(data.mappings),
                destination_tables: JSON.stringify(data.destination_tables),
                created_at: new Date().toISOString()
            }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: AirtableError = await response.json();
                errorMessage = error.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to save mapping: ${errorMessage}`);
        }

        const result = await response.json();
        toast.success('Saved mapping successfully !!!');
        return result;
    } catch (error) {
        console.error('Saved mapping export error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu mapping. Vui lòng thử lại.';
        toast.error(errorMessage);
        throw error;
    }
};

export const getMappingExports = async (): Promise<unknown[]> => {
    try {
        validateConfig();

        // Sort by created_at descending
        const url = `${API_URL}?sort%5B0%5D%5Bfield%5D=created_at&sort%5B0%5D%5Bdirection%5D=desc`;

        const response = await fetch(url, {
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: AirtableError = await response.json();
                errorMessage = error.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to fetch mappings: ${errorMessage}`);
        }

        const data: AirtableResponse = await response.json();

        // Transform Airtable records to our format with error handling
        return data.records.map((record: AirtableRecord) => {
            try {
                return {
                    id: record.id,
                    name: record.fields.name || 'Unnamed',
                    mappings: JSON.parse(record.fields.mappings || '{}'),
                    destination_tables: JSON.parse(record.fields.destination_tables || '{}'),
                    created_at: record.fields.created_at,
                    createdTime: record.createdTime
                };
            } catch (parseError) {
                console.warn(`Failed to parse record ${record.id}:`, parseError);
                return {
                    id: record.id,
                    name: record.fields.name || 'Unnamed',
                    mappings: {},
                    destination_tables: {},
                    created_at: record.fields.created_at,
                    createdTime: record.createdTime
                };
            }
        });
    } catch (error) {
        console.error('Get mapping exports error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách mapping. Vui lòng thử lại.';
        toast.error(errorMessage);
        throw error;
    }
};

export const deleteMappingExport = async (id: string): Promise<void> => {
    try {
        validateConfig();

        if (!id || !id.trim()) {
            throw new Error('Record ID is required');
        }

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const error: AirtableError = await response.json();
                errorMessage = error.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Utility function để test connection
export const testAirtableConnection = async (): Promise<boolean> => {
    try {
        validateConfig();

        const response = await fetch(`${API_URL}?maxRecords=1`, {
            headers: headers
        });

        return response.ok;
    } catch (error) {
        console.error('Airtable connection test failed:', error);
        return false;
    }
};