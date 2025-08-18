// File: src/services/mappingExportService.ts
interface MappingExportData {
    name: string;
    mappings: any;
    destination_tables: any;
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

export const saveMappingExport = async (data: MappingExportData): Promise<any> => {
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
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(`Failed to save mapping: ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Save mapping export error:', error);
        throw error;
    }
};

export const getMappingExports = async (): Promise<any[]> => {
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
    } catch (error) {
        console.error('Delete mapping export error:', error);
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