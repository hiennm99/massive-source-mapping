// JsonMapperVisualizer.tsx - Main component that orchestrates everything
import React, { useState, useCallback } from 'react';
import { Table, Save, Loader2 } from 'lucide-react';
import ScannedSchema from '../data/scanned_schema.json';

import Navbar from "../components/Navbar.tsx";

// Import custom hooks
import { useMappingLogic } from '../hooks/useMappingLogic';
import { useDestinationTables } from '../hooks/useDestinationTables.ts';
import { useExportLogic } from '../hooks/useExportLogic';

// Import components
import { SourceDataPanel } from '../components/SourceDataPanel';
import { DestinationTablesPanel } from '../components/DestinationTablesPanel';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ToastNotification } from '../components/ToastNotification';
import { PanelHeader } from '../components/PanelHeader';
import type {FileData} from '../types';

const JsonMapperVisualizer: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const [jsonData] = useState<FileData[]>(ScannedSchema);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Custom hooks
    const {
        mappings,
        setMappings,
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
    } = useMappingLogic();

    const {
        destinationTables,
        globalFilter,
        setGlobalFilter,
        getFilteredColumns,
        removeTable,
        removeColumn
    } = useDestinationTables();

    const {
        isExporting,
        exportMessage,
        exportMappings
    } = useExportLogic();

    // Local state handlers
    const toggleNode = useCallback((path: string): void => {
        setExpandedNodes(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(path)) {
                newExpanded.delete(path);
            } else {
                newExpanded.add(path);
            }
            return newExpanded;
        });
    }, []);

    const handleRemoveTable = useCallback((tableId: string): void => {
        const tableToRemove = removeTable(tableId);
        if (tableToRemove) {
            setMappings(prev => prev.filter(mapping =>
                mapping.destination.table !== tableToRemove.name
            ));
        }
    }, [removeTable, setMappings]);

    const handleRemoveColumn = useCallback((tableId: string, columnToRemove: string): void => {
        const table = removeColumn(tableId, columnToRemove);
        if (table) {
            setMappings(prev => prev.filter(mapping =>
                !(mapping.destination.table === table.name && mapping.destination.column === columnToRemove)
            ));
        }
    }, [removeColumn, setMappings]);

    const handleExport = useCallback(async (): Promise<void> => {
        const result = await exportMappings(mappings, destinationTables);
        if (result) {
            // Clear mappings on successful export
            setTimeout(() => {
                setMappings([]);
            }, 3000);
        }
    }, [exportMappings, mappings, destinationTables, setMappings]);

    return (
        <>
            <Navbar />
            <div className="h-screen flex bg-gray-50 relative">
                {/* Loading Overlay */}
                <LoadingOverlay isVisible={isExporting} />

                {/* Toast Notification */}
                <ToastNotification
                    message={exportMessage}
                    isVisible={!!exportMessage}
                />

                {/* Source Data Panel */}
                <SourceDataPanel
                    jsonData={jsonData}
                    expandedNodes={expandedNodes}
                    onToggleNode={toggleNode}
                    onDragStart={handleDragStart}
                    isFileMapped={isFileMapped}
                    isSheetMapped={isSheetMapped}
                    getFileMappingCount={getFileMappingCount}
                    getSheetMappingCount={getSheetMappingCount}
                    isColumnMapped={isColumnMapped}
                    getColumnMappingCount={getColumnMappingCount}
                />

                {/* Destination Tables Panel */}
                <div className="">
                    <PanelHeader
                        icon={Table}
                        title="Destination Tables"
                        gradient="bg-gradient-to-r from-teal-500 via-emerald-600 to-green-600"
                    >
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white hover:from-amber-600 hover:via-orange-700 hover:to-red-700 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-sm flex items-center transition-colors rounded-lg"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-1 text-white" />
                            )}
                            {isExporting ? 'Saving...' : 'Save'}
                        </button>
                    </PanelHeader>

                    <DestinationTablesPanel
                        destinationTables={destinationTables}
                        mappings={mappings}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={setGlobalFilter}
                        getFilteredColumns={getFilteredColumns}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onRemoveTable={handleRemoveTable}
                        onRemoveColumn={handleRemoveColumn}
                        onRemoveMapping={removeMapping}
                    />
                </div>
            </div>
        </>
    );
};

export default JsonMapperVisualizer;