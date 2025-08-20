// hooks/useExportLogic.ts - Hook for export functionality
import { useState, useCallback } from 'react';
import type {ColumnMapping, DestinationTable} from '../types';
import {saveMappingExport} from '../services/mappingExportService2';

export const useExportLogic = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState<string>('');

    const exportMappings = useCallback(async (
        mappings: ColumnMapping[],
        destinationTables: DestinationTable[]
    ): Promise<unknown> => {
        setIsExporting(true);
        setExportMessage('');

        try {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create filename with timestamp
            const timestamp = new Date().toLocaleString('vi-VN');
            const exportName = `Mapping Export - ${timestamp}`;

            const mappingData = {
                name: exportName,
                mappings: mappings,
                destination_tables: destinationTables
            };

            // Save to Database
            const result = await saveMappingExport(mappingData);
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
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        isExporting,
        exportMessage,
        exportMappings
    };
};