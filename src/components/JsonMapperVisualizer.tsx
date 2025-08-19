import React, {useState, useCallback} from 'react';
import { ChevronRight, ChevronDown, Table, Database, Trash2, File, Sheet, Columns, Check, Loader2, Save, Search, X  } from 'lucide-react';
import ScannedSchema from'../data/scanned_schema.json'
import Navbar from "./Navbar.tsx";
import { saveMappingExport } from "../services/mappingExportService2.tsx";

// Type definitions
interface SourceColumn {
    path: string;
    value: string;
    type: 'column' | 'value' | 'property';
    file?: string;
    sheet?: string;
}

interface SheetData {
    sheet_name: string;
    have_header: boolean;
    columns: string[];
    sample_data: string[];
}

interface FileData {
    file: string;
    sheets: SheetData[];
}

interface DestinationTable {
    id: string;
    name: string;
    columns: string[];
}

interface ColumnMapping {
    id: number;
    source: SourceColumn;
    destination: {
        table: string;
        column: string;
    };
}

const JsonMapperVisualizer: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const [jsonData] = useState<FileData[]>(ScannedSchema);

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [destinationTables, setDestinationTables] = useState<DestinationTable[]>([
        {
            id: 'general_data_table',
            name: 'general',
            columns: [
                'fiscal_code',
                'full_name', 'gender', 'dob', 'pob', 'note',
                'country', 'postcode', 'region', 'province', 'city', 'address', 'vat_number',
                'phone_number', 'email', 'bank_abi', 'bank_cab', 'account_number',
                'borrower_ndg', 'gbv', 'dbt_date', 'originator', 'credit_type'
            ]
        },
        {
            id: 'guarantee_data_table',
            name: 'guarantee',
            columns: [
                'guarantee_fiscal_code',
                'full_name', 'gender', 'dob', 'pob', 'note',
                'country', 'postcode', 'region', 'province', 'city', 'address',
                'phone_number', 'email', 'bank_abi', 'bank_cab', 'account_number', 'vat_number',
                'main_borrower_ndg', 'guarantee_ndg', 'guarantee_type', 'guarantee limit'
            ]
        },
        {
            id: 'join_borrower_table',
            name: 'join_borrower',
            columns: [
                'join_borrower_fiscal_code',
                'full_name', 'gender', 'dob', 'pob', 'note',
                'country', 'postcode', 'region', 'province', 'city', 'address',
                'phone_number', 'email', 'bank_abi', 'bank_cab', 'account_number', 'vat_number',
                'main_borrower_ndg', 'join_borrower_ndg'
            ]
        },
        {
            id: 'asset_table',
            name: 'asset',
            columns: [
                'asset_id', 'ndg', 'type', 'last_evaluation_amount', 'last_evaluation_date',
                'country', 'postcode', 'region', 'province', 'city', 'address',
                'sheet', 'particle', 'sub', 'category', 'square_meter', 'vain'
            ]
        }
    ]);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [draggedItem, setDraggedItem] = useState<SourceColumn | null>(null);

    // Export states
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState<string>('');
    // Global filter for all tables
    const [globalFilter, setGlobalFilter] = useState<string>('');

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

    // Helper function to get mapping count for a column (in case of multiple mappings)
    const getColumnMappingCount = useCallback((fileName: string, sheetName: string, columnName: string): number => {
        return mappings.filter(mapping =>
            mapping.source.file === fileName &&
            mapping.source.sheet === sheetName &&
            mapping.source.value === columnName
        ).length;
    }, [mappings]);

    // Filter columns based on global search term
    const getFilteredColumns = useCallback((table: DestinationTable): string[] => {
        if (!globalFilter.trim()) {
            return table.columns;
        }

        return table.columns.filter(column =>
            column.toLowerCase().includes(globalFilter.toLowerCase())
        );

    }, [globalFilter]);

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

    const removeTable = useCallback((tableId: string): void => {
        const tableToRemove = destinationTables.find(table => table.id === tableId);
        setDestinationTables(prev => prev.filter(table => table.id !== tableId));

        if (tableToRemove) {
            setMappings(prev => prev.filter(mapping =>
                mapping.destination.table !== tableToRemove.name
            ));
        }
    }, [destinationTables]);

    const removeColumn = useCallback((tableId: string, columnToRemove: string): void => {
        // Remove column from table
        setDestinationTables(prev =>
            prev.map(table =>
                table.id === tableId
                    ? { ...table, columns: table.columns.filter(col => col !== columnToRemove) }
                    : table
            )
        );

        // Remove all mappings for this column
        const table = destinationTables.find(t => t.id === tableId);
        if (table) {
            setMappings(prev => prev.filter(mapping =>
                !(mapping.destination.table === table.name && mapping.destination.column === columnToRemove)
            ));
        }
    }, [destinationTables]);

    const exportMappings = useCallback(async (): Promise<void> => {
        setIsExporting(true);
        setExportMessage('');

        try {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Tạo tên file với timestamp
            const timestamp = new Date().toLocaleString('vi-VN');
            const exportName = `Mapping Export - ${timestamp}`;

            const mappingData = {
                name: exportName,
                mappings: mappings,
                destination_tables: destinationTables
            };

            // Lưu lên Database
            const result = await saveMappingExport(mappingData);
            setExportMessage('Saved mapping successfully!');

            // Auto clear message after 3 seconds
            setTimeout(() => {
                setExportMessage('');
                setMappings([]);
            }, 3000);

            console.log('Saved to Database:', result);

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
    }, [mappings, destinationTables]);

    const renderDataStructure = useCallback(() => {
        return (
            <div className="space-y-4">
                {jsonData.map((fileData, fileIndex) => {
                    const fileName = fileData.file.split('\\').pop() || fileData.file;
                    const fileKey = `file-${fileIndex}`;
                    const isMappedFile = isFileMapped(fileName);
                    const fileMappingCount = getFileMappingCount(fileName);

                    return (
                        <div key={fileIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {/* File Header - With mapping status styling */}
                            <div
                                className={`border-b border-gray-200 p-4 cursor-pointer transition-colors ${
                                    isMappedFile
                                        ? 'bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100'
                                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100'
                                }`}
                                onClick={() => toggleNode(fileKey)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {expandedNodes.has(fileKey) ?
                                            <ChevronDown className={`w-5 h-5 mr-2 ${isMappedFile ? 'text-red-600' : 'text-blue-600'}`} /> :
                                            <ChevronRight className={`w-5 h-5 mr-2 ${isMappedFile ? 'text-red-600' : 'text-blue-600'}`} />
                                        }
                                        <File className={`w-5 h-5 mr-3 ${isMappedFile ? 'text-red-600' : 'text-blue-600'}`} />
                                        <div>
                                            <h3 className="font-semibold text-gray-800 text-lg">{fileName}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{fileData.file}</p>
                                            <div className="flex items-center mt-2 space-x-4">
                                                <div className="flex items-center">
                                                    <Sheet className="w-4 h-4 text-gray-400 mr-1" />
                                                    <span className="text-sm text-gray-600">{fileData.sheets.length} sheets</span>
                                                </div>
                                                {isMappedFile && (
                                                    <div className="flex items-center">
                                                        <Check className="w-4 h-4 text-red-600 mr-1" />
                                                        <span className="text-sm text-red-600 font-medium">
                                                            {fileMappingCount} mapping{fileMappingCount > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isMappedFile && (
                                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                            Mapped
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sheets Content */}
                            {expandedNodes.has(fileKey) && (
                                <div className="p-4">
                                    <div className="space-y-3">
                                        {fileData.sheets.map((sheet, sheetIndex) => {
                                            const sheetKey = `${fileKey}-sheet-${sheetIndex}`;
                                            const hasColumns = sheet.columns && sheet.columns.length > 0;
                                            const isMappedSheet = isSheetMapped(fileName, sheet.sheet_name);
                                            const sheetMappingCount = getSheetMappingCount(fileName, sheet.sheet_name);

                                            return (
                                                <div key={sheetIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    {/* Sheet Header - With mapping status styling */}
                                                    <div
                                                        className={`p-3 cursor-pointer transition-colors ${
                                                            isMappedSheet
                                                                ? 'bg-red-50 hover:bg-red-100'
                                                                : 'bg-gray-50 hover:bg-gray-100'
                                                        }`}
                                                        onClick={() => toggleNode(sheetKey)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                {hasColumns ? (
                                                                    expandedNodes.has(sheetKey) ?
                                                                        <ChevronDown className={`w-4 h-4 mr-2 ${isMappedSheet ? 'text-red-600' : 'text-gray-600'}`} /> :
                                                                        <ChevronRight className={`w-4 h-4 mr-2 ${isMappedSheet ? 'text-red-600' : 'text-gray-600'}`} />
                                                                ) : (
                                                                    <div className="w-4 h-4 mr-2" />
                                                                )}
                                                                <Sheet className={`w-4 h-4 mr-2 ${isMappedSheet ? 'text-red-600' : 'text-gray-600'}`} />
                                                                <span className={`font-medium ${isMappedSheet ? 'text-red-800' : 'text-gray-800'}`}>
                                                                    {sheet.sheet_name}
                                                                </span>
                                                                {isMappedSheet && (
                                                                    <div className="ml-2 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                                                        {sheetMappingCount} mapped
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex items-center">
                                                                    <div className={`w-3 h-3 rounded-full mr-2 ${sheet.have_header ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                                    <span className="text-sm text-gray-600">
                                                                        {sheet.have_header ? 'Has Header' : 'No Header'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Columns className="w-4 h-4 text-gray-500 mr-1" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {sheet.columns?.length || 0} columns
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Columns Content */}
                                                    {hasColumns && expandedNodes.has(sheetKey) && (
                                                        <div className="p-4 bg-white">
                                                            <div className="mb-3">
                                                                <div className="flex items-center mb-2">
                                                                    <Columns className="w-4 h-4 text-green-600 mr-2" />
                                                                    <span className="text-sm font-medium text-gray-700">Available Columns:</span>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                {sheet.columns.map((column, columnIndex) => {
                                                                    const isMapped = isColumnMapped(fileName, sheet.sheet_name, column);
                                                                    const mappingCount = getColumnMappingCount(fileName, sheet.sheet_name, column);

                                                                    return (
                                                                        <div
                                                                            key={columnIndex}
                                                                            className={`border rounded-lg px-3 py-2 cursor-grab transition-all duration-200 transform hover:scale-105 ${
                                                                                isMapped
                                                                                    ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400'
                                                                                    : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
                                                                            }`}
                                                                            draggable
                                                                            onDragStart={(e) => handleDragStart(e, {
                                                                                path: `${fileName} > ${sheet.sheet_name} > ${column}`,
                                                                                value: column,
                                                                                type: 'column',
                                                                                file: fileName,
                                                                                sheet: sheet.sheet_name
                                                                            })}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center">
                                                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                                        isMapped ? 'bg-red-500' : 'bg-green-500'
                                                                                    }`}>
                                                                                    </div>
                                                                                    <div className="flex flex-col">
                                                                                        <span className={`font-medium text-sm ${
                                                                                            isMapped ? 'text-red-800' : 'text-green-800'
                                                                                        }`}>{column}</span>
                                                                                        <span className='text-xs text-gray-500'>{sheet.sample_data[columnIndex]}</span>
                                                                                    </div>
                                                                                </div>
                                                                                {isMapped && (
                                                                                    <div className="flex items-center">
                                                                                        <Check className="w-4 h-4 text-red-600" />
                                                                                        {mappingCount > 1 && (
                                                                                            <span className="ml-1 text-xs bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                                                                                {mappingCount}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className={`text-xs mt-1 ${
                                                                                isMapped ? 'text-red-600' : 'text-green-600'
                                                                            }`}>
                                                                                {isMapped && (
                                                                                    <span className="ml-2 font-medium">
                                                                                        ✓ Mapped
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Empty State for sheets without columns */}
                                                    {!hasColumns && (
                                                        <div className="p-4 text-center text-gray-500">
                                                            <Columns className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                            <div className="text-sm">No columns available</div>
                                                            <div className="text-xs text-gray-400">This sheet appears to be empty or has no defined structure</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }, [jsonData, expandedNodes, handleDragStart, toggleNode, isColumnMapped, getColumnMappingCount, isFileMapped, isSheetMapped, getFileMappingCount, getSheetMappingCount]);

    return (
        <>
            <Navbar />
            <div className="h-screen flex bg-gray-50 relative">
                {/* Saving Overlay */}
                {isExporting && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-6 max-w-sm mx-4">
                            {/* Animated spinner */}
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                            </div>

                            {/* Content */}
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Saving Your Mapping</h3>
                                <p className="text-gray-600">Please wait while we export your data...</p>
                            </div>

                            {/* Progress dots animation */}
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success/Error Message Toast */}
                {exportMessage && (
                    <div className="fixed top-4 right-4 z-40 max-w-md">
                        <div className={`rounded-lg shadow-lg p-4 border-l-4 ${
                            exportMessage.includes('Error')
                                ? 'bg-red-50 border-red-400 text-red-800'
                                : 'bg-green-50 border-green-400 text-green-800'
                        }`}>
                            <div className="flex items-center">
                                {exportMessage.includes('Error') ? (
                                    <div className="w-5 h-5 text-red-600 mr-2">❌</div>
                                ) : (
                                    <div className="w-5 h-5 text-green-600 mr-2">✅</div>
                                )}
                                <span className="font-medium">{exportMessage}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* JSON Source Panel */}
                <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
                    <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-700 text-white p-4 flex items-center">
                        <Database className="w-5 h-5 mr-2" />
                        <h2 className="text-lg font-semibold">Source Data Structure</h2>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        {renderDataStructure()}
                    </div>
                </div>

                {/* Destination Tables Panel */}
                <div className="w-1/2 flex flex-col">
                    <div className="bg-gradient-to-r from-teal-500 via-emerald-600 to-green-600  text-white p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <Table className="w-5 h-5 mr-2" />
                            <h2 className="text-lg font-semibold">Destination Tables</h2>
                        </div>
                        <button
                            onClick={exportMappings}
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
                    </div>

                    {/* Global Search Filter */}
                    <div className="bg-white border-b border-gray-200 p-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search all columns across all tables..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
                            />
                            {globalFilter && (
                                <button
                                    onClick={() => setGlobalFilter('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
                                >
                                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>
                        {globalFilter && (
                            <div className="mt-2 text-sm text-gray-600">
                                Searching for: <span className="font-medium text-blue-600">"{globalFilter}"</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        {destinationTables.map(table => {
                            const filteredColumns = getFilteredColumns(table);

                            // Hide table completely if no columns match the filter
                            if (globalFilter && filteredColumns.length === 0) {
                                return null;
                            }

                            return (
                                <div key={table.id} className="mb-6 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                    {/* Table Header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="bg-green-100 p-2 rounded-lg mr-3">
                                                    <Table className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 text-lg">{table.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {globalFilter && filteredColumns.length !== table.columns.length ? (
                                                            <>
                                                                {filteredColumns.length} of {table.columns.length} columns matching "{globalFilter}"
                                                            </>
                                                        ) : (
                                                            <>
                                                                {table.columns.length} {table.columns.length === 1 ? 'column' : 'columns'}
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeTable(table.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-2 rounded-lg transition-all duration-200"
                                                title="Delete table"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Table Content */}
                                    <div className="p-6">
                                        {table.columns.length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                                    <Columns className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <div className="text-gray-500 font-medium mb-1">No columns defined</div>
                                                <div className="text-sm text-gray-400">Add columns using the form above</div>
                                            </div>
                                        ) : filteredColumns.length === 0 && globalFilter ? (
                                            <div className="text-center py-8">
                                                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <div className="text-gray-500 font-medium mb-1">No matching columns in {table.name}</div>
                                                <div className="text-sm text-gray-400">No columns match "{globalFilter}" in this table</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {filteredColumns.map((column, index) => {
                                                    const columnMappings = mappings.filter(m =>
                                                        m.destination.table === table.name && m.destination.column === column
                                                    );

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="group border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDrop(e, table, column)}
                                                        >
                                                            {/* Column Header */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center">
                                                                    <div className="bg-blue-100 p-1.5 rounded-lg mr-3">
                                                                        <Columns className="w-4 h-4 text-blue-600" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold text-gray-800">{column}</div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {columnMappings.length > 0
                                                                                ? `${columnMappings.length} mapping${columnMappings.length > 1 ? 's' : ''}`
                                                                                : 'Drop column here'
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeColumn(table.id, column)}
                                                                    className="opacity-0 group-hover:opacity-100 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-1.5 rounded-lg transition-all duration-200"
                                                                    title="Delete column"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            {/* Mappings */}
                                                            {columnMappings.length > 0 && (
                                                                <div className="space-y-2">
                                                                    {columnMappings.map(mapping => (
                                                                        <div key={mapping.id} className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center mb-1">
                                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                                                        <span className="text-sm font-medium text-blue-700">Mapped from:</span>
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-700 ml-4">
                                                                                        {mapping.source.file} → {mapping.source.sheet} → <span className="font-medium">{mapping.source.value}</span>
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 ml-4 mt-1">
                                                                                        Type: {mapping.source.type}
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => removeMapping(mapping.id)}
                                                                                    className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-1.5 rounded-lg transition-all duration-200 ml-3"
                                                                                    title="Remove mapping"
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty state for no tables */}
                        {destinationTables.length === 0 && (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                    <Table className="w-10 h-10 text-gray-400" />
                                </div>
                                <div className="text-gray-500 font-medium mb-2">No destination tables</div>
                                <div className="text-sm text-gray-400">Create your first table using the form above</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>

    );
};

export default JsonMapperVisualizer;