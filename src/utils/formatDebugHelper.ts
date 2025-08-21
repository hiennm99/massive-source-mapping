// utils/formatDebugHelper.ts - Simple utility to debug format issues
export interface DebugMappingSource {
    file: string;
    sheet: string;
    column: string;
}

export interface DebugMappingData {
    name: string;
    mappings: {
        [key: string]: DebugMappingSource | Array<{[key: string]: DebugMappingSource}>;
    };
}

/**
 * Debug helper to validate format before sending to backend
 */
export const debugMappingFormat = (data: any): {
    isValid: boolean;
    issues: string[];
    summary: string;
} => {
    const issues: string[] = [];

    // Check basic structure
    if (!data) {
        issues.push('Data is null or undefined');
        return { isValid: false, issues, summary: 'Invalid data structure' };
    }

    if (typeof data !== 'object') {
        issues.push('Data is not an object');
        return { isValid: false, issues, summary: 'Invalid data type' };
    }

    // Check name
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        issues.push('Name is missing or empty');
    }

    // Check mappings
    if (!data.mappings || typeof data.mappings !== 'object') {
        issues.push('Mappings is missing or not an object');
        return { isValid: false, issues, summary: 'Missing mappings' };
    }

    let totalMappings = 0;
    let validMappings = 0;

    for (const [key, value] of Object.entries(data.mappings)) {
        if (key === 'guarantors' || key === 'joints' || key === 'assets') {
            // These should be arrays
            if (!Array.isArray(value)) {
                issues.push(`${key} should be an array but is ${typeof value}`);
                continue;
            }

            value.forEach((item, index) => {
                if (!item || typeof item !== 'object') {
                    issues.push(`${key}[${index}] is not an object`);
                    return;
                }

                for (const [subKey, subValue] of Object.entries(item)) {
                    totalMappings++;
                    const sourceResult = validateMappingSource(subValue, `${key}[${index}].${subKey}`);
                    if (sourceResult.isValid) {
                        validMappings++;
                    } else {
                        issues.push(sourceResult.error!);
                    }
                }
            });
        } else {
            // Regular mapping
            totalMappings++;
            const sourceResult = validateMappingSource(value, key);
            if (sourceResult.isValid) {
                validMappings++;
            } else {
                issues.push(sourceResult.error!);
            }
        }
    }

    const summary = `${validMappings}/${totalMappings} mappings valid`;

    return {
        isValid: issues.length === 0 && totalMappings > 0,
        issues,
        summary
    };
};

/**
 * Validate a single mapping source
 */
const validateMappingSource = (source: any, context: string): {
    isValid: boolean;
    error?: string;
} => {
    if (!source || typeof source !== 'object') {
        return {
            isValid: false,
            error: `${context}: Invalid mapping source - must be an object, got ${typeof source}`
        };
    }

    const requiredFields = ['file', 'sheet', 'column'];
    for (const field of requiredFields) {
        if (!(field in source)) {
            return {
                isValid: false,
                error: `${context}: Missing required field '${field}'`
            };
        }

        if (typeof source[field] !== 'string') {
            return {
                isValid: false,
                error: `${context}: Field '${field}' must be a string, got ${typeof source[field]}`
            };
        }

        if (!source[field].trim()) {
            return {
                isValid: false,
                error: `${context}: Field '${field}' cannot be empty`
            };
        }
    }

    return { isValid: true };
};

/**
 * Create a sample valid format for testing
 */
export const createSampleFormat = (): DebugMappingData => {
    return {
        name: "Test Mapping Export",
        mappings: {
            // Regular fields
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
            // Guarantors array
            guarantors: [
                {
                    guarantor_fiscal_code: {
                        file: "guarantors.xlsx",
                        sheet: "Sheet1",
                        column: "g1_fiscal_code"
                    },
                    guarantor_name: {
                        file: "guarantors.xlsx",
                        sheet: "Sheet1",
                        column: "g1_name"
                    }
                },
                {
                    guarantor_fiscal_code: {
                        file: "guarantors.xlsx",
                        sheet: "Sheet1",
                        column: "g2_fiscal_code"
                    },
                    guarantor_name: {
                        file: "guarantors.xlsx",
                        sheet: "Sheet1",
                        column: "g2_name"
                    }
                }
            ],
            // Joints array
            joints: [
                {
                    joint_fiscal_code: {
                        file: "joints.xlsx",
                        sheet: "Sheet1",
                        column: "j1_fiscal_code"
                    },
                    joint_name: {
                        file: "joints.xlsx",
                        sheet: "Sheet1",
                        column: "j1_name"
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
}): string => {
    const lines: string[] = [];

    lines.push(`=== Mapping Format Debug ===`);
    lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
    lines.push(`Summary: ${result.summary}`);

    if (result.issues.length > 0) {
        lines.push(`\nIssues found (${result.issues.length}):`);
        result.issues.forEach((issue, index) => {
            lines.push(`  ${index + 1}. ${issue}`);
        });
    }

    return lines.join('\n');
};

/**
 * Quick test function - logs results to console
 */
export const testMappingFormat = (data: any): boolean => {
    const result = debugMappingFormat(data);
    console.log(formatDebugResults(result));
    return result.isValid;
};

export default {
    debugMappingFormat,
    createSampleFormat,
    formatDebugResults,
    testMappingFormat
};