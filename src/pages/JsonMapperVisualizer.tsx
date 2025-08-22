// JsonMapperVisualizer.tsx - Updated with ExcelUpload integration
import React, { useState, useCallback } from 'react';
import { Table, Save, Loader2, Upload } from 'lucide-react';
import Navbar from "../components/Navbar.tsx";

// Import custom hooks
import { useMappingLogic } from '../hooks/useMappingLogic';
import { useDestinationTables } from '../hooks/useDestinationTables.ts';
import { useExportLogic } from '../hooks/useExportLogic';

// Import components
import ExcelUpload from '../components/ExcelUpload'; // Add this import
import { SourceDataPanel } from '../components/SourceDataPanel';
import { DestinationTablesPanel } from '../components/DestinationTablesPanel';
import { SavingOverlay } from '../components/SavingOverlay';
import { ParsingOverlay } from "../components/ParsingOverlay.tsx";
import { ToastNotification } from '../components/ToastNotification';
import { PanelHeader } from '../components/PanelHeader';
import type { FileData } from '../types';
import { useNavigate } from "react-router";

const JsonMapperVisualizer: React.FC = () => {
    const navigate = useNavigate();

    // Change this to use dynamic data from ExcelUpload
    const [jsonData, setJsonData] = useState<FileData[]>([]); // Start with empty array
    const [isUploadLoading, setIsUploadLoading] = useState(false); // Add upload loading state
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Add source filter state
    const [sourceGlobalFilter, setSourceGlobalFilter] = useState<string>('');
    const [, setExportMessage] = useState<string>('');

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
        globalFilter: destinationGlobalFilter,
        setGlobalFilter: setDestinationGlobalFilter,
        getFilteredColumns
    } = useDestinationTables();

    const {
        isExporting,
        exportMessage,
        exportMappings
    } = useExportLogic();

    // Handler for when ExcelUpload loads schema data
    const handleSchemaLoaded = useCallback((schemas: FileData[]) => {
        console.log('Schema loaded:', schemas);
        setJsonData(schemas);
        // Auto-expand first file when data is loaded
        if (schemas.length > 0) {
            setExpandedNodes(new Set(['file-0']));
        }
    }, []);

    // Handler to go back to upload
    const handleBackToUpload = useCallback(() => {
        setJsonData([]);
        setMappings([]); // Clear any existing mappings
        setExpandedNodes(new Set());
        setSourceGlobalFilter('');
    }, [setMappings]);

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

    const handleSave = useCallback(async (): Promise<void> => {
        try {
            if (!mappings || mappings.length === 0) {
                setExportMessage('No mappings to save. Please create some mappings first.');
                setTimeout(() => setExportMessage(''), 3000);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const result = await exportMappings(mappings, destinationTables);

            if (result) {
                console.log('Export successful, clearing mappings after delay...');
                setTimeout(() => {
                    setMappings([]);
                    setJsonData([]); // Clear data to show upload screen
                    setExpandedNodes(new Set());
                    setSourceGlobalFilter('');
                    console.log('Mappings cleared, back to upload');
                }, 1000);
            }
        } catch (error) {
            console.error('Save failed:', error);
        }
    }, [exportMappings, mappings, destinationTables, setMappings, navigate]);

    // Helper function to get mapping count for display
    const getMappingCountDisplay = useCallback((): string => {
        const count = mappings.length;
        if (count === 0) return 'No mappings';
        if (count === 1) return '1 mapping';
        return `${count} mappings`;
    }, [mappings.length]);

    return (
        <>
            <Navbar />
            <div className="h-screen flex bg-gray-50 relative">
                {/* Loading Overlay */}
                <SavingOverlay isVisible={isExporting} />
                <ParsingOverlay isVisible={isUploadLoading} />

                {/* Toast Notification */}
                <ToastNotification
                    message={exportMessage}
                    isVisible={!!exportMessage}
                />

                {/* Conditional rendering based on whether data is loaded */}
                {jsonData.length === 0 ? (
                    // Show ExcelUpload when no data
                    <div className="w-full flex items-center justify-center">
                        <ExcelUpload
                            onSchemaLoaded={handleSchemaLoaded}
                            isLoading={isUploadLoading}
                            setIsLoading={setIsUploadLoading}
                        />
                    </div>
                ) : (
                    // Show mapping interface when data is loaded
                    <>
                        {/* Source Data Panel with Filter */}
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
                            globalFilter={sourceGlobalFilter}
                            onGlobalFilterChange={setSourceGlobalFilter}
                        />

                        {/* Destination Tables Panel */}
                        <div className="w-2/3">
                            <PanelHeader
                                icon={Table}
                                title="Destination Tables"
                                gradient="bg-gradient-to-r from-teal-500 via-emerald-600 to-green-600"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Back to Upload button */}
                                    <button
                                        onClick={handleBackToUpload}
                                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 text-sm flex items-center transition-colors rounded-lg"
                                        title="Upload different files"
                                    >
                                        <Upload className="w-4 h-4 mr-1" />
                                        Upload New Files
                                    </button>

                                    {/* Mapping count indicator */}
                                    <span className="text-sm text-white/80 bg-white/20 px-2 py-1 rounded">
                                        {getMappingCountDisplay()}
                                    </span>

                                    {/* Save button */}
                                    <button
                                        onClick={handleSave}
                                        disabled={isExporting || mappings.length === 0}
                                        className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white hover:from-amber-600 hover:via-orange-700 hover:to-red-700 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-sm flex items-center transition-colors rounded-lg"
                                        title={mappings.length === 0 ? "No mappings to save" : "Save current mappings"}
                                    >
                                        {isExporting ? (
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-1 text-white" />
                                        )}
                                        {isExporting ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </PanelHeader>

                            <DestinationTablesPanel
                                destinationTables={destinationTables}
                                mappings={mappings}
                                globalFilter={destinationGlobalFilter}
                                onGlobalFilterChange={setDestinationGlobalFilter}
                                getFilteredColumns={getFilteredColumns}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onRemoveMapping={removeMapping}
                            />
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default JsonMapperVisualizer;