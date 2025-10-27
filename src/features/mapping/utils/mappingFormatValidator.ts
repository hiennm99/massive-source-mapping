// utils/mappingFormatValidator.ts - Utility for validating mapping format
export interface MappingSource {
    file: string;
    sheet: string;
    column: string;
}

export interface ServiceMappingData {
    name: string;
    mappings: {
        [key: string]: MappingSource | Array<{[key: string]: MappingSource}>;
    };
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitizedData?: ServiceMappingData;
}

/**
 * Validates a single MappingSource object
 */
export const validateMappingSource = (source: any, context: string = ''): {
    isValid: boolean;
    error?: string;
    sanitized?: MappingSource;
} => {
    if (!source || typeof source !== 'object') {
        return {
            isValid: false,
            error: `${context}: Invalid mapping source structure - must be an object`
        };
    }

    // Check for required fields and ensure they have meaningful values
    const file = typeof source.file === 'string' ? source.file.trim() : '';
    const sheet = typeof source.sheet === 'string' ? source.sheet.trim() : '';
    const column = typeof source.column === 'string' ? source.column.trim() : '';

    // Validate that all required fields have meaningful values
    if (!file || !sheet || !column) {
        return {
            isValid: false,
            error: `${context}: Missing required fields - file="${file}", sheet="${sheet}", column="${column}"`
        };
    }

    return {
        isValid: true,
        sanitized: { file, sheet, column }
    };
};

/**
 * Validates an array of mapping objects (for guarantors, joints, assets)
 */
export const validateArrayMappings = (
    data: any,
    arrayType: string
): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitized: Array<{[key: string]: MappingSource}>;
} => {
    const result = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        sanitized: [] as Array<{[key: string]: MappingSource}>
    };

    if (!data || !Array.isArray(data)) {
        result.warnings.push(`${arrayType} data is not an array, treating as empty`);
        return result;
    }

    data.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
            result.warnings.push(`${arrayType}[${index}]: Invalid item - not an object, skipping`);
            return;
        }

        const validItem: {[key: string]: MappingSource} = {};
        let hasValidMapping = false;

        for (const [key, value] of Object.entries(item)) {
            const validation = validateMappingSource(value, `${arrayType}[${index}].${key}`);

            if (validation.isValid && validation.sanitized) {
                validItem[key] = validation.sanitized;
                hasValidMapping = true;
            } else {
                result.warnings.push(validation.error || `Unknown validation error for ${arrayType}[${index}].${key}`);
            }
        }

        // Only add item if it has at least one valid mapping
        if (hasValidMapping && Object.keys(validItem).length > 0) {
            result.sanitized.push(validItem);
        } else {
            result.warnings.push(`${arrayType}[${index}]: No valid mappings found, skipping entire item`);
        }
    });

    return result;
};

/**
 * Comprehensive validation of the entire mapping data structure
 */
export const validateServiceMappingData = (data: any): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    // Basic structure validation
    if (!data) {
        result.errors.push('Data is required');
        result.isValid = false;
        return result;
    }

    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        result.errors.push('Name is required and must be a non-empty string');
        result.isValid = false;
    }

    if (!data.mappings || typeof data.mappings !== 'object') {
        result.errors.push('Mappings are required and must be an object');
        result.isValid = false;
        return result;
    }

    // If basic validation failed, return early
    if (!result.isValid) {
        return result;
    }

    // Start building sanitized data
    const sanitizedData: ServiceMappingData = {
        name: data.name.trim(),
        mappings: {}
    };

    let hasValidMappings = false;

    // Validate each mapping
    for (const [key, value] of Object.entries(data.mappings)) {
        if (key === 'guarantors' || key === 'joints' || key === 'assets') {
            // These should be arrays
            const arrayValidation = validateArrayMappings(value, key);

            // Add warnings from array validation
            result.warnings.push(...arrayValidation.warnings);

            if (arrayValidation.sanitized.length > 0) {
                sanitizedData.mappings[key] = arrayValidation.sanitized;
                hasValidMappings = true;
            } else {
                result.warnings.push(`${key} array is empty after validation`);
            }
        } else {
            // Regular mappings should be MappingSource objects
            const sourceValidation = validateMappingSource(value, `mappings.${key}`);

            if (sourceValidation.isValid && sourceValidation.sanitized) {
                sanitizedData.mappings[key] = sourceValidation.sanitized;
                hasValidMappings = true;
            } else {
                result.warnings.push(sourceValidation.error || `Unknown validation error for mappings.${key}`);
            }
        }
    }

    // Final validation
    if (!hasValidMappings) {
        result.errors.push('No valid mappings found - all mappings have missing or empty required fields (file, sheet, column)');
        result.isValid = false;
    } else {
        result.sanitizedData = sanitizedData;
    }

    return result;
};

/**
 * Pretty prints validation results for debugging
 */
export const formatValidationResult = (result: ValidationResult): string => {
    const lines: string[] = [];

    lines.push(`Validation Result: ${result.isValid ? 'VALID' : 'INVALID'}`);

    if (result.errors.length > 0) {
        lines.push('\nErrors:');
        result.errors.forEach((error, index) => {
            lines.push(`  ${index + 1}. ${error}`);
        });
    }

    if (result.warnings.length > 0) {
        lines.push('\nWarnings:');
        result.warnings.forEach((warning, index) => {
            lines.push(`  ${index + 1}. ${warning}`);
        });
    }

    if (result.sanitizedData) {
        const mappingCount = Object.keys(result.sanitizedData.mappings).length;
        lines.push(`\nSanitized data has ${mappingCount} mapping groups`);

        // Count individual mappings
        let totalMappings = 0;
        Object.entries(result.sanitizedData.mappings).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                const arrayTotal = value.reduce((sum, item) => sum + Object.keys(item).length, 0);
                totalMappings += arrayTotal;
                lines.push(`  - ${key}: ${value.length} groups with ${arrayTotal} total mappings`);
            } else {
                totalMappings += 1;
                lines.push(`  - ${key}: 1 mapping`);
            }
        });
        lines.push(`Total individual mappings: ${totalMappings}`);
    }

    return lines.join('\n');
};

/**
 * Quick validation function that throws on invalid data
 */
export const validateAndSanitize = (data: any): ServiceMappingData => {
    const validation = validateServiceMappingData(data);

    if (!validation.isValid) {
        const errorMessage = `Validation failed:\n${formatValidationResult(validation)}`;
        throw new Error(errorMessage);
    }

    if (validation.warnings.length > 0) {
        console.warn('Validation warnings:', formatValidationResult(validation));
    }

    return validation.sanitizedData!;
};