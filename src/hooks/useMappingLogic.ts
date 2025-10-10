import React, { useState, useCallback, useEffect } from 'react';
import type { SourceColumn, ColumnMapping, DestinationTable, MappingSource, ExportFormat } from "../types";
import { COLUMN_GROUPS, BASE_COLUMNS } from '../config/columnGroups';

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

    // NEW: Helper function to check if a destination column is already mapped
    const isDestinationMapped = useCallback((destinationTable: string, destinationColumn: string): boolean => {
        return mappings.some(mapping =>
            mapping.destination.table === destinationTable &&
            mapping.destination.column === destinationColumn
        );
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
            // MODIFIED: Check if destination column is already mapped
            const existingMapping = mappings.find(m =>
                m.destination.table === destinationTable.name &&
                m.destination.column === destinationColumn
            );

            if (existingMapping) {
                // Replace the existing mapping instead of adding a new one
                const mapping: ColumnMapping = {
                    id: Date.now(),
                    source: draggedItem,
                    destination: {
                        table: destinationTable.name,
                        column: destinationColumn
                    }
                };

                // Remove old mapping and add new one
                setMappings(prev => [
                    ...prev.filter(m => m.id !== existingMapping.id),
                    mapping
                ]);
            } else {
                // Add new mapping if destination is not mapped yet
                const mapping: ColumnMapping = {
                    id: Date.now(),
                    source: draggedItem,
                    destination: {
                        table: destinationTable.name,
                        column: destinationColumn
                    }
                };
                setMappings(prev => [...prev, mapping]);
            }

            setDraggedItem(null);
        }
    }, [draggedItem, mappings]);

    const removeMapping = useCallback((mappingId: number): void => {
        setMappings(prev => prev.filter(m => m.id !== mappingId));
    }, []);

    // Helper function to create a proper MappingSource object
    const createMappingSource = useCallback((mapping: ColumnMapping): MappingSource | null => {
        if (!mapping || !mapping.source) {
            console.warn('Invalid mapping structure:', mapping);
            return null;
        }

        const file = mapping.source.file || '';
        const sheet = mapping.source.sheet || '';
        const column = mapping.source.value || '';

        // Return null if all fields are empty
        if (!file.trim() && !sheet.trim() && !column.trim()) {
            return null;
        }

        return {
            file: file.trim(),
            sheet: sheet.trim(),
            column: column.trim()
        };
    }, []);

    // Convert internal mappings to export format - ONLY EXPORT MAPPED FIELDS
    const exportMappings = useCallback((): ExportFormat => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-GB', {hour12: false});
        const dateString = now.toLocaleDateString('en-GB');

        const result: ExportFormat = {
            id: crypto.randomUUID(),
            name: `Mapping Export - ${timeString} ${dateString}`,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            mappings: {}
        };

        if (!mappings || mappings.length === 0) {
            console.warn('No mappings to export');
            return result;
        }

        // Initialize storage
        const groupMappings: {
            [groupKey: string]: { [instanceNumber: number]: { [field: string]: MappingSource } }
        } = {};
        const baseMappings: { [key: string]: MappingSource } = {};

        // Process all mappings
        mappings.forEach(mapping => {
            try {
                if (!mapping || !mapping.destination || !mapping.destination.column) {
                    console.warn('Skipping invalid mapping:', mapping);
                    return;
                }

                const destColumn = mapping.destination.column;
                const mappingSource = createMappingSource(mapping);

                // Skip empty mappings
                if (!mappingSource) {
                    return;
                }

                // Check if it's a base column
                if (BASE_COLUMNS.includes(destColumn)) {
                    baseMappings[destColumn] = mappingSource;
                    return;
                }

                // Check if it belongs to any group
                let matched = false;
                for (const group of COLUMN_GROUPS) {
                    if (group.isMultiInstance) {
                        // Pattern: prefix_number_field (e.g., address_1_street)
                        const regex = new RegExp(`^${group.prefix}_(\\d+)_(.+)$`);
                        const match = destColumn.match(regex);

                        if (match) {
                            const instanceNumber = parseInt(match[1]);
                            const fieldName = match[2];

                            if (!groupMappings[group.key]) {
                                groupMappings[group.key] = {};
                            }
                            if (!groupMappings[group.key][instanceNumber]) {
                                groupMappings[group.key][instanceNumber] = {};
                            }

                            groupMappings[group.key][instanceNumber][fieldName] = mappingSource;
                            matched = true;
                            break;
                        }
                    } else {
                        // Pattern: prefix_field
                        const regex = new RegExp(`^${group.prefix}_(.+)$`);
                        const match = destColumn.match(regex);

                        if (match) {
                            const fieldName = match[1];

                            if (!groupMappings[group.key]) {
                                groupMappings[group.key] = {};
                            }
                            if (!groupMappings[group.key][1]) {
                                groupMappings[group.key][1] = {};
                            }

                            groupMappings[group.key][1][fieldName] = mappingSource;
                            matched = true;
                            break;
                        }
                    }
                }

                if (!matched) {
                    console.warn('Column does not match any group or base column:', destColumn);
                }
            } catch (error) {
                console.error('Error processing mapping:', mapping, error);
            }
        });

        // Add base mappings only if there are any
        if (Object.keys(baseMappings).length > 0) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            result.mappings.base = baseMappings;
        }

        // Convert group mappings to array format - only non-empty instances
        for (const group of COLUMN_GROUPS) {
            const instances = groupMappings[group.key];

            if (instances && Object.keys(instances).length > 0) {
                const instanceArray = [];

                const sortedNumbers = Object.keys(instances)
                    .map(n => parseInt(n))
                    .sort((a, b) => a - b);

                for (const num of sortedNumbers) {
                    const instanceFields = instances[num];

                    // Only add if there are fields with data
                    if (Object.keys(instanceFields).length > 0) {
                        instanceArray.push(instanceFields);
                    }
                }

                // Only add group if it has at least one instance with data
                if (instanceArray.length > 0) {
                    result.mappings[group.key] = instanceArray;
                }
            }
        }

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
            // Import base mappings
            if (importData.mappings.base) {
                Object.entries(importData.mappings.base).forEach(([field, source]) => {
                    if (source && (source.file || source.sheet || source.column)) {
                        newMappings.push({
                            id: idCounter++,
                            source: {
                                file: source.file || '',
                                sheet: source.sheet || '',
                                value: source.column || ''
                            },
                            destination: {
                                table: 'default',
                                column: field
                            }
                        });
                    }
                });
            }

            // Import group mappings
            for (const group of COLUMN_GROUPS) {
                const groupData = importData.mappings[group.key];
                if (Array.isArray(groupData)) {
                    groupData.forEach((instance, index) => {
                        Object.entries(instance).forEach(([field, source]) => {
                            if (source && (source.file || source.sheet || source.column)) {
                                const columnName = `${group.prefix}_${index + 1}_${field}`;
                                newMappings.push({
                                    id: idCounter++,
                                    source: {
                                        file: source.file || '',
                                        sheet: source.sheet || '',
                                        value: source.column || ''
                                    },
                                    destination: {
                                        table: 'default',
                                        column: columnName
                                    }
                                });
                            }
                        });
                    });
                }
            }

            setMappings(newMappings);
        } catch (error) {
            console.error('Error importing mappings:', error);
        }
    }, []);

    // Convert to service format for API calls
    const getMappingsForService = useCallback(() => {
        const exportData = exportMappings();

        if (!exportData.mappings || Object.keys(exportData.mappings).length === 0) {
            throw new Error('No valid mappings to export');
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
        updated_at: string;
        mappings: any;
    }) => {
        const formattedData: ExportFormat = {
            id: serviceData.id,
            name: serviceData.name,
            created_at: serviceData.created_at,
            updated_at: serviceData.updated_at,
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
        isDestinationMapped, // NEW: Export this helper

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