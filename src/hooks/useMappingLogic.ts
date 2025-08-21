// hooks/useMappingLogic.ts - Fixed version
import React, { useState, useCallback, useEffect } from 'react';
import type {SourceColumn, ColumnMapping, DestinationTable, MappingSource, ExportFormat} from "../types";


export const useMappingLogic = () => {
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [draggedItem, setDraggedItem] = useState<SourceColumn | null>(null);

    // Helper function to check if a file has any mappings
    const isFileMapped = useCallback((fileName: string): boolean => {
        return mappings.some(mapping => mapping.source.file === fileName);
    }, [mappings]);

    // Helper function to check if a sheet has any mappings
    const isSheetMapped = useCallback((fileName: string, sheetName: string): boolean => {
        return mappings.some(mapping =>
            mapping.source.file === fileName && mapping.source.sheet === sheetName
        );
    }, [mappings]);

    // Helper function to get the count of mappings for a file
    const getFileMappingCount = useCallback((fileName: string): number => {
        return mappings.filter(mapping => mapping.source.file === fileName).length;
    }, [mappings]);

    // Helper function to get the count of mappings for a sheet
    const getSheetMappingCount = useCallback((fileName: string, sheetName: string): number => {
        return mappings.filter(mapping =>
            mapping.source.file === fileName && mapping.source.sheet === sheetName
        ).length;
    }, [mappings]);

    // Helper function to check if a column is mapped
    const isColumnMapped = useCallback((fileName: string, sheetName: string, columnName: string): boolean => {
        return mappings.some(mapping =>
            mapping.source.file === fileName &&
            mapping.source.sheet === sheetName &&
            mapping.source.value === columnName
        );
    }, [mappings]);

    // Helper function to get mapping count for a column
    const getColumnMappingCount = useCallback((fileName: string, sheetName: string, columnName: string): number => {
        return mappings.filter(mapping =>
            mapping.source.file === fileName &&
            mapping.source.sheet === sheetName &&
            mapping.source.value === columnName
        ).length;
    }, [mappings]);

    // Drag and Drop handlers
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, item: SourceColumn): void => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'copy';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((
        e: React.DragEvent<HTMLDivElement>,
        destinationTable: DestinationTable,
        destinationColumn: string
    ): void => {
        e.preventDefault();
        if (draggedItem) {
            const mapping: ColumnMapping = {
                id: Date.now(),
                source: draggedItem,
                destination: {
                    table: destinationTable.name,
                    column: destinationColumn
                }
            };
            setMappings(prev => [...prev, mapping]);
            setDraggedItem(null);
        }
    }, [draggedItem]);

    const removeMapping = useCallback((mappingId: number): void => {
        setMappings(prev => prev.filter(m => m.id !== mappingId));
    }, []);

    // FIXED: Helper function to create a proper MappingSource object with validation
    const createMappingSource = useCallback((mapping: ColumnMapping): MappingSource | null => {
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

        return {
            file: file.trim(),
            sheet: sheet.trim(),
            column: column.trim()
        };
    }, []);

    // FIXED: Convert internal mappings to export format with proper validation
    const exportMappings = useCallback((): ExportFormat => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
        const dateString = now.toLocaleDateString('en-GB');

        const result: ExportFormat = {
            id: crypto.randomUUID(),
            name: `Mapping Export - ${timeString} ${dateString}`,
            created_at: now.toISOString().slice(0, 19).replace('T', ' '),
            mappings: {}
        };

        // Validate we have mappings to process
        if (!mappings || mappings.length === 0) {
            console.warn('No mappings to export');
            return result;
        }

        // Separate mappings by type
        const guarantorMappings: { [key: number]: {[key: string]: MappingSource} } = {};
        const jointMappings: { [key: number]: {[key: string]: MappingSource} } = {};
        const assetMappings: { [key: number]: {[key: string]: MappingSource} } = {};

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
        console.log('Final export mappings:', JSON.stringify(result, null, 2));

        return result;
    }, [mappings, createMappingSource]);

    // Function to save mappings to JSON file
    const downloadMappingsAsJSON = useCallback(() => {
        const exportData = exportMappings();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mapping-export-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [exportMappings]);

    // Function to load mappings from exported format
    const importMappings = useCallback((importData: ExportFormat) => {
        const newMappings: ColumnMapping[] = [];
        let idCounter = Date.now();

        try {
            Object.entries(importData.mappings).forEach(([key, value]) => {
                if (key === 'guarantors' && Array.isArray(value)) {
                    value.forEach((guarantor, index) => {
                        Object.entries(guarantor).forEach(([field, source]) => {
                            // Validate source before creating mapping
                            if (source && source.file && source.sheet && source.column) {
                                const columnName = `guarantor_${index + 1}_${field.replace('guarantor_', '')}`;
                                newMappings.push({
                                    id: idCounter++,
                                    source: {
                                        file: source.file,
                                        sheet: source.sheet,
                                        value: source.column
                                    },
                                    destination: {
                                        table: 'default',
                                        column: columnName
                                    }
                                });
                            }
                        });
                    });
                } else if (key === 'joints' && Array.isArray(value)) {
                    value.forEach((joint, index) => {
                        Object.entries(joint).forEach(([field, source]) => {
                            // Validate source before creating mapping
                            if (source && source.file && source.sheet && source.column) {
                                const columnName = `joint_${index + 1}_${field.replace('joint_', '')}`;
                                newMappings.push({
                                    id: idCounter++,
                                    source: {
                                        file: source.file,
                                        sheet: source.sheet,
                                        value: source.column
                                    },
                                    destination: {
                                        table: 'default',
                                        column: columnName
                                    }
                                });
                            }
                        });
                    });
                } else if (key === 'assets' && Array.isArray(value)) {
                    value.forEach((asset, index) => {
                        Object.entries(asset).forEach(([field, source]) => {
                            // Validate source before creating mapping
                            if (source && source.file && source.sheet && source.column) {
                                const columnName = `asset_${index + 1}_${field.replace('asset_', '')}`;
                                newMappings.push({
                                    id: idCounter++,
                                    source: {
                                        file: source.file,
                                        sheet: source.sheet,
                                        value: source.column
                                    },
                                    destination: {
                                        table: 'default',
                                        column: columnName
                                    }
                                });
                            }
                        });
                    });
                } else if (!Array.isArray(value) && value && typeof value === 'object') {
                    // Regular mapping - ensure it's a valid MappingSource object
                    if (value.file && value.sheet && value.column) {
                        newMappings.push({
                            id: idCounter++,
                            source: {
                                file: value.file,
                                sheet: value.sheet,
                                value: value.column
                            },
                            destination: {
                                table: 'default',
                                column: key
                            }
                        });
                    } else {
                        console.warn('Invalid mapping source for key:', key, value);
                    }
                }
            });

            setMappings(newMappings);
        } catch (error) {
            console.error('Error importing mappings:', error);
        }
    }, []);

    // FIXED: Convert internal mappings to service format for API calls with validation
    const getMappingsForService = useCallback(() => {
        const exportData = exportMappings();

        // Validate that we have valid mappings
        if (!exportData.mappings || Object.keys(exportData.mappings).length === 0) {
            throw new Error('No valid mappings to export');
        }

        // Additional validation: check that all mapping sources are valid objects
        const validateMappings = (mappings: unknown): boolean => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            for (const [key, value] of Object.entries(mappings)) {
                if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            if (typeof item !== 'object' || !item) {
                                return false;
                            }
                            for (const [, subValue] of Object.entries(item)) {
                                if (!subValue || typeof subValue !== 'object') {
                                    return false;
                                }
                            }
                        }
                    }
                } else {
                    if (!value || typeof value !== 'object') {
                        return false;
                    }
                }
            }
            return true;
        };

        if (!validateMappings(exportData.mappings)) {
            throw new Error('Invalid mapping data structure detected');
        }

        return {
            name: exportData.name,
            mappings: exportData.mappings
        };
    }, [exportMappings]);

    // Load mappings from service response format
    const loadMappingsFromService = useCallback((serviceData: {
        id: string;
        name: string;
        created_at: string;
        mappings: {[key: string]: MappingSource | Array<{[key: string]: MappingSource}>};
    }) => {
        const formattedData: ExportFormat = {
            id: serviceData.id,
            name: serviceData.name,
            created_at: serviceData.created_at,
            mappings: serviceData.mappings
        };
        importMappings(formattedData);
    }, [importMappings]);

    useEffect(() => {
        if (mappings.length > 0) {
            try {
                const exportFormat = exportMappings();
                console.log("Export format:", exportFormat);
            } catch (error) {
                console.error("Error generating export format:", error);
            }
        }
    }, [mappings, exportMappings]);

    return {
        // State
        mappings,
        setMappings,
        draggedItem,
        setDraggedItem,

        // File/Sheet/Column helpers
        isFileMapped,
        isSheetMapped,
        getFileMappingCount,
        getSheetMappingCount,
        isColumnMapped,
        getColumnMappingCount,

        // Drag and Drop
        handleDragStart,
        handleDragOver,
        handleDrop,
        removeMapping,

        // Export/Import
        exportMappings,
        downloadMappingsAsJSON,
        importMappings,

        // Service integration
        getMappingsForService,
        loadMappingsFromService
    };
};