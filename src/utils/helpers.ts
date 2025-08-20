// utils/helpers.ts - Utility functions and helpers
// utils/helpers.ts - Utility functions and helpers
import type {ColumnMapping, DestinationTable} from '../types';

/**
 * Extract filename from full path
 */
export const extractFileName = (fullPath: string): string => {
    return fullPath.split('\\').pop() || fullPath;
};

/**
 * Generate unique ID for mappings
 */
export const generateMappingId = (): number => {
    return Date.now() + Math.random();
};

/**
 * Format timestamp for Vietnamese locale
 */
export const formatTimestamp = (): string => {
    return new Date().toLocaleString('vi-VN');
};

/**
 * Check if a string contains a search term (case insensitive)
 */
export const matchesSearch = (text: string, searchTerm: string): boolean => {
    return text.toLowerCase().includes(searchTerm.toLowerCase());
};

/**
 * Get mappings for a specific destination column
 */
export const getMappingsForColumn = (
    mappings: ColumnMapping[],
    tableName: string,
    columnName: string
): ColumnMapping[] => {
    return mappings.filter(m =>
        m.destination.table === tableName && m.destination.column === columnName
    );
};

/**
 * Remove mappings associated with a table
 */
export const removeMappingsForTable = (
    mappings: ColumnMapping[],
    tableName: string
): ColumnMapping[] => {
    return mappings.filter(mapping => mapping.destination.table !== tableName);
};

/**
 * Remove mappings associated with a specific column
 */
export const removeMappingsForColumn = (
    mappings: ColumnMapping[],
    tableName: string,
    columnName: string
): ColumnMapping[] => {
    return mappings.filter(mapping =>
        !(mapping.destination.table === tableName && mapping.destination.column === columnName)
    );
};

/**
 * Validate mapping data before export
 */
export const validateMappingData = (
    mappings: ColumnMapping[],
    destinationTables: DestinationTable[]
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (mappings.length === 0) {
        errors.push('No mappings defined');
    }

    if (destinationTables.length === 0) {
        errors.push('No destination tables defined');
    }

    // Check for orphaned mappings (mappings to tables that don't exist)
    const tableNames = new Set(destinationTables.map(t => t.name));
    const orphanedMappings = mappings.filter(m => !tableNames.has(m.destination.table));

    if (orphanedMappings.length > 0) {
        errors.push(`Found ${orphanedMappings.length} mappings to non-existent tables`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Group mappings by source file
 */
export const groupMappingsByFile = (mappings: ColumnMapping[]): Record<string, ColumnMapping[]> => {
    return mappings.reduce((acc, mapping) => {
        const fileName = mapping.source.file || 'unknown';
        if (!acc[fileName]) {
            acc[fileName] = [];
        }
        acc[fileName].push(mapping);
        return acc;
    }, {} as Record<string, ColumnMapping[]>);
};

/**
 * Create export summary statistics
 */
export const createExportSummary = (
    mappings: ColumnMapping[],
    destinationTables: DestinationTable[]
) => {
    const fileGroups = groupMappingsByFile(mappings);
    const totalFiles = Object.keys(fileGroups).length;
    const totalColumns = mappings.length;
    const tablesWithMappings = new Set(mappings.map(m => m.destination.table)).size;

    return {
        totalMappings: mappings.length,
        totalFiles,
        totalColumns,
        totalDestinationTables: destinationTables.length,
        tablesWithMappings,
        averageMappingsPerTable: tablesWithMappings > 0 ? (mappings.length / tablesWithMappings).toFixed(1) : '0'
    };
};