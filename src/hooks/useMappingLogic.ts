// hooks/useMappingLogic.ts - Custom hook for all mapping logic
import { useState, useCallback } from 'react';
import type { SourceColumn, DestinationTable, ColumnMapping } from "../types.ts";

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

    return {
        mappings,
        setMappings,
        draggedItem,
        setDraggedItem,
        isFileMapped,
        isSheetMapped,
        getFileMappingCount,
        getSheetMappingCount,
        isColumnMapped,
        getColumnMappingCount,
        handleDragStart,
        handleDragOver,
        handleDrop,
        removeMapping
    };
};