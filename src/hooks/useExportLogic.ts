import { useState, useCallback } from 'react';
import type { ColumnMapping } from '../types';
import { saveMappingExport } from '../services/mappingExportService';
import { testMappingFormat } from '../utils/formatDebugHelper';

interface ServiceMappingData {
    name: string;
    mappings: {
        [key: string]: {
            file: string;
            sheet: string;
            column: string;
        } | Array<{[key: string]: {
                file: string;
                sheet: string;
                column: string;
            }}>;
    };
}

export const useExportLogic = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState<string>('');

    // Helper function to create a proper MappingSource object with validation
    const createMappingSource = useCallback((mapping: ColumnMapping): {
        file: string;
        sheet: string;
        column: string;
    } | null => {
        // Validate the mapping structure first
        if (!mapping || !mapping.source) {
            console.warn('Invalid mapping structure:', mapping);
            return null;
        }

        // Ensure all properties exist and are strings
        const file = mapping.source.file || '';
        const sheet = mapping.source.sheet || '';
        const column = mapping.source.value || '';

        // Validate that all required fields have meaningful values
        if (!file.trim() || !sheet.trim() || !column.trim()) {
            console.warn('Invalid mapping source data - missing required fields:', { file, sheet, column });
            return null;
        }

        // Return plain object with exactly the format the backend expects
        return {
            file: file.trim(),
            sheet: sheet.trim(),
            column: column.trim()
        };
    }, []);

    // Convert internal mappings to the new service format
    const convertToServiceFormat = useCallback((mappings: ColumnMapping[]): ServiceMappingData => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
        const dateString = now.toLocaleDateString('en-GB');

        const result: ServiceMappingData = {
            name: `Mapping Export - ${timeString} ${dateString}`,
            mappings: {}
        };

        // Validate we have mappings to process
        if (!mappings || mappings.length === 0) {
            console.warn('No mappings to export');
            return result;
        }

        // Separate mappings by type
        const guarantorMappings: { [key: number]: {[key: string]: {
                    file: string;
                    sheet: string;
                    column: string;
                }} } = {};
        const jointMappings: { [key: number]: {[key: string]: {
                    file: string;
                    sheet: string;
                    column: string;
                }} } = {};
        const assetMappings: { [key: number]: {[key: string]: {
                    file: string;
                    sheet: string;
                    column: string;
                }} } = {};

        mappings.forEach(mapping => {
            try {
                // Skip invalid mappings
                if (!mapping || !mapping.destination || !mapping.destination.column) {
                    console.warn('Skipping invalid mapping:', mapping);
                    return;
                }

                const destColumn = mapping.destination.column;
                const mappingSource = createMappingSource(mapping);

                // Skip if we couldn't create a valid mapping source
                if (!mappingSource) {
                    console.warn('Skipping mapping with invalid source:', mapping);
                    return;
                }

                // Check if it's a guarantor column (pattern: guarantor_N_field or guarantor_field)
                const guarantorMatch = destColumn.match(/^guarantor(?:_(\d+))?_(.+)$/);
                if (guarantorMatch) {
                    const number = guarantorMatch[1] ? parseInt(guarantorMatch[1]) : 1;
                    const fieldName = `guarantor_${guarantorMatch[2]}`;

                    if (!guarantorMappings[number]) {
                        guarantorMappings[number] = {};
                    }
                    guarantorMappings[number][fieldName] = mappingSource;
                    return;
                }

                // Check if it's a joint column (pattern: joint_N_field or joint_field)
                const jointMatch = destColumn.match(/^joint(?:_(\d+))?_(.+)$/);
                if (jointMatch) {
                    const number = jointMatch[1] ? parseInt(jointMatch[1]) : 1;
                    const fieldName = `joint_${jointMatch[2]}`;

                    if (!jointMappings[number]) {
                        jointMappings[number] = {};
                    }
                    jointMappings[number][fieldName] = mappingSource;
                    return;
                }

                // Check if it's an asset column (pattern: asset_N_field or asset_field)
                const assetMatch = destColumn.match(/^asset(?:_(\d+))?_(.+)$/);
                if (assetMatch) {
                    const number = assetMatch[1] ? parseInt(assetMatch[1]) : 1;
                    const fieldName = `asset_${assetMatch[2]}`;

                    if (!assetMappings[number]) {
                        assetMappings[number] = {};
                    }
                    assetMappings[number][fieldName] = mappingSource;
                    return;
                }

                // Regular column (main borrower fields)
                result.mappings[destColumn] = mappingSource;
            } catch (error) {
                console.error('Error processing mapping:', mapping, error);
            }
        });

        // Convert guarantor mappings to array format
        if (Object.keys(guarantorMappings).length > 0) {
            const guarantorArray = Object.keys(guarantorMappings)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(key => guarantorMappings[parseInt(key)])
                .filter(item => item && Object.keys(item).length > 0); // Filter out empty objects

            if (guarantorArray.length > 0) {
                result.mappings.guarantors = guarantorArray;
            }
        }

        // Convert joint mappings to array format
        if (Object.keys(jointMappings).length > 0) {
            const jointArray = Object.keys(jointMappings)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(key => jointMappings[parseInt(key)])
                .filter(item => item && Object.keys(item).length > 0); // Filter out empty objects

            if (jointArray.length > 0) {
                result.mappings.joints = jointArray;
            }
        }

        // Convert asset mappings to array format
        if (Object.keys(assetMappings).length > 0) {
            const assetArray = Object.keys(assetMappings)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(key => assetMappings[parseInt(key)])
                .filter(item => item && Object.keys(item).length > 0); // Filter out empty objects

            if (assetArray.length > 0) {
                result.mappings.assets = assetArray;
            }
        }

        // Log the final result for debugging
        console.log('Final export mappings for service:', JSON.stringify(result, null, 2));

        return result;
    }, [createMappingSource]);

    const exportMappings = useCallback(async (
        mappings: ColumnMapping[]
    ): Promise<unknown> => {
        setIsExporting(true);
        setExportMessage('');

        try {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Convert mappings to the new service format
            const serviceData = convertToServiceFormat(mappings);

            // Validate that we have valid mappings
            if (!serviceData.mappings || Object.keys(serviceData.mappings).length === 0) {
                throw new Error('No valid mappings to export');
            }

            console.log('Sending data to service:', serviceData);

            // Debug the format before sending
            const isFormatValid = testMappingFormat(serviceData);
            if (!isFormatValid) {
                throw new Error('Invalid mapping format detected. Check console for details.');
            }

            // Save to Database using the service
            const result = await saveMappingExport(serviceData);
            setExportMessage('Saved mapping successfully!');

            // Auto clear message after 3 seconds
            setTimeout(() => {
                setExportMessage('');
            }, 3000);

            console.log('Saved to Database:', result);
            return result;

        } catch (error) {
            console.error('Export error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setExportMessage(`Error when saving data: ${errorMessage}`);

            // Auto clear error message after 5 seconds
            setTimeout(() => {
                setExportMessage('');
            }, 5000);

            // Re-throw the error so the caller can handle it if needed
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, [convertToServiceFormat]);

    return {
        isExporting,
        exportMessage,
        exportMappings
    };
};