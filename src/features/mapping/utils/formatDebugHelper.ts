// utils/formatDebugHelper.ts - Validates structure only, not content
export interface DebugMappingSource {
    file: string;
    sheet: string;
    column: string;
}

export interface DebugMappingData {
    name: string;
    mappings: {
        [key: string]: DebugMappingSource | Array<{[key: string]: DebugMappingSource}> | {[key: string]: DebugMappingSource};
    };
}

/**
 * Debug helper to validate FORMAT STRUCTURE ONLY (not content completeness)
 * This only checks if the data structure is correct, not if fields are filled
 */
export const debugMappingFormat = (data: any): {
    isValid: boolean;
    issues: string[];
    summary: string;
    stats: {
        totalMappings: number;
        structurallyValid: number;
        filledMappings: number;
    };
} => {
    const issues: string[] = [];

    // Check basic structure
    if (!data) {
        issues.push('Data is null or undefined');
        return {
            isValid: false,
            issues,
            summary: 'Invalid data structure',
            stats: { totalMappings: 0, structurallyValid: 0, filledMappings: 0 }
        };
    }

    if (typeof data !== 'object') {
        issues.push('Data is not an object');
        return {
            isValid: false,
            issues,
            summary: 'Invalid data type',
            stats: { totalMappings: 0, structurallyValid: 0, filledMappings: 0 }
        };
    }

    // Check name (structural check only)
    if (!('name' in data) || typeof data.name !== 'string') {
        issues.push('Name field is missing or not a string');
    }

    // Check mappings exists
    if (!data.mappings || typeof data.mappings !== 'object') {
        issues.push('Mappings is missing or not an object');
        return {
            isValid: false,
            issues,
            summary: 'Missing mappings',
            stats: { totalMappings: 0, structurallyValid: 0, filledMappings: 0 }
        };
    }

    let totalMappings = 0;
    let structurallyValid = 0;
    let filledMappings = 0;

    // Process base mappings (if exists)
    if (data.mappings.base && typeof data.mappings.base === 'object') {
        for (const [subKey, subValue] of Object.entries(data.mappings.base)) {
            totalMappings++;
            const sourceResult = validateMappingSourceStructure(subValue, `base.${subKey}`);
            if (sourceResult.isStructurallyValid) {
                structurallyValid++;
                if (sourceResult.isFilled) {
                    filledMappings++;
                }
            } else {
                issues.push(sourceResult.error!);
            }
        }
    }

    // Process other mappings
    for (const [key, value] of Object.entries(data.mappings)) {
        if (key === 'base') continue; // Already processed

        // Check if it's an array (groups like addresses, contacts, etc.)
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (!item || typeof item !== 'object') {
                    issues.push(`${key}[${index}] is not an object`);
                    return;
                }

                for (const [subKey, subValue] of Object.entries(item)) {
                    totalMappings++;
                    const sourceResult = validateMappingSourceStructure(subValue, `${key}[${index}].${subKey}`);
                    if (sourceResult.isStructurallyValid) {
                        structurallyValid++;
                        if (sourceResult.isFilled) {
                            filledMappings++;
                        }
                    } else {
                        issues.push(sourceResult.error!);
                    }
                }
            });
        } else if (typeof value === 'object' && value !== null) {
            // Regular mapping (non-array, non-base)
            totalMappings++;
            const sourceResult = validateMappingSourceStructure(value, key);
            if (sourceResult.isStructurallyValid) {
                structurallyValid++;
                if (sourceResult.isFilled) {
                    filledMappings++;
                }
            } else {
                issues.push(sourceResult.error!);
            }
        } else {
            issues.push(`${key}: Invalid value type - expected object or array, got ${typeof value}`);
        }
    }

    const stats = {
        totalMappings,
        structurallyValid,
        filledMappings
    };

    const summary = `Format: ${structurallyValid}/${totalMappings} valid | Content: ${filledMappings} filled`;

    // Only fail if structure is invalid, not if fields are empty
    return {
        isValid: issues.length === 0,
        issues,
        summary,
        stats
    };
};

/**
 * Validate STRUCTURE only - checks if object has correct shape, not if fields are filled
 */
const validateMappingSourceStructure = (source: any, context: string): {
    isStructurallyValid: boolean;
    isFilled: boolean;
    error?: string;
} => {
    if (!source || typeof source !== 'object') {
        return {
            isStructurallyValid: false,
            isFilled: false,
            error: `${context}: Invalid structure - must be an object, got ${typeof source}`
        };
    }

    const requiredFields = ['file', 'sheet', 'column'];
    for (const field of requiredFields) {
        if (!(field in source)) {
            return {
                isStructurallyValid: false,
                isFilled: false,
                error: `${context}: Missing required field '${field}'`
            };
        }

        if (typeof source[field] !== 'string') {
            return {
                isStructurallyValid: false,
                isFilled: false,
                error: `${context}: Field '${field}' must be a string, got ${typeof source[field]}`
            };
        }
    }

    // Check if mapping has actual content (all 3 fields filled)
    const isFilled = source.file.trim() !== '' &&
        source.sheet.trim() !== '' &&
        source.column.trim() !== '';

    return { isStructurallyValid: true, isFilled };
};

/**
 * Create a sample valid format for testing
 */
export const createSampleFormat = (): DebugMappingData => {
    return {
        name: "Test Mapping Export",
        mappings: {
            base: {
                fiscal_code: {
                    file: "application.xlsx",
                    sheet: "Sheet1",
                    column: "fiscal_code"
                },
                name: {
                    file: "application.xlsx",
                    sheet: "Sheet1",
                    column: "full_name"
                },
                surname: {
                    file: "",
                    sheet: "",
                    column: ""
                }
            },
            addresses: [
                {
                    street: {
                        file: "addresses.xlsx",
                        sheet: "Sheet1",
                        column: "street"
                    },
                    city: {
                        file: "addresses.xlsx",
                        sheet: "Sheet1",
                        column: "city"
                    },
                    postcode: {
                        file: "",
                        sheet: "",
                        column: ""
                    }
                }
            ],
            guarantors: [
                {
                    fiscal_code: {
                        file: "guarantors.xlsx",
                        sheet: "Sheet1",
                        column: "g1_fiscal_code"
                    },
                    name: {
                        file: "guarantors.xlsx",
                        sheet: "Sheet1",
                        column: "g1_name"
                    }
                }
            ]
        }
    };
};

/**
 * Pretty print debug results
 */
export const formatDebugResults = (result: {
    isValid: boolean;
    issues: string[];
    summary: string;
    stats: {
        totalMappings: number;
        structurallyValid: number;
        filledMappings: number;
    };
}): string => {
    const lines: string[] = [];

    lines.push(`=== Mapping Format Debug ===`);
    lines.push(`Status: ${result.isValid ? '✅ VALID STRUCTURE' : '❌ INVALID STRUCTURE'}`);
    lines.push(`Summary: ${result.summary}`);
    lines.push(`Stats:`);
    lines.push(`  - Total mappings: ${result.stats.totalMappings}`);
    lines.push(`  - Structurally valid: ${result.stats.structurallyValid}`);
    lines.push(`  - Filled with data: ${result.stats.filledMappings}`);

    if (result.issues.length > 0) {
        lines.push(`\n⚠️  Structural Issues (${result.issues.length}):`);
        result.issues.forEach((issue, index) => {
            lines.push(`  ${index + 1}. ${issue}`);
        });
    } else {
        lines.push(`\n✅ No structural issues - format is correct!`);
        if (result.stats.filledMappings < result.stats.totalMappings) {
            lines.push(`ℹ️  Note: ${result.stats.totalMappings - result.stats.filledMappings} mappings have empty fields (will be filtered by service)`);
        }
    }

    return lines.join('\n');
};

/**
 * Quick test function - logs results to console
 * Returns true if STRUCTURE is valid (doesn't care about empty fields)
 */
export const testMappingFormat = (data: any): boolean => {
    const result = debugMappingFormat(data);
    console.log(formatDebugResults(result));

    if (!result.isValid) {
        console.error('❌ Format validation failed - structure is invalid');
        return false;
    }

    if (result.stats.filledMappings === 0) {
        console.warn('⚠️  Warning: No filled mappings found (all fields are empty)');
    }

    return result.isValid;
};

export default {
    debugMappingFormat,
    createSampleFormat,
    formatDebugResults,
    testMappingFormat
};