import React, {useState, useCallback} from 'react';
import { ChevronRight, ChevronDown, Table, Database, Plus, Trash2, Download, File, Sheet, Columns, Check } from 'lucide-react';

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

interface MappingExport {
    mappings: ColumnMapping[];
    destinationTables: DestinationTable[];
    timestamp: string;
}

const JsonMapperVisualizer: React.FC = () => {
    const [jsonData, setJsonData] = useState<FileData[]>([]);

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [destinationTables, setDestinationTables] = useState<DestinationTable[]>([
        {
            id: 'general_data_table',
            name: 'general_data',
            columns: [
                'fiscal_code', 'full_name', 'gender', 'date_of_birth', 'place_of_birth', 'note',
                'country', 'postcode', 'region', 'province', 'city', 'address',
                'phone_number', 'email', 'bank_abi', 'bank_cab', 'account_number'
            ]
        }
    ]);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [draggedItem, setDraggedItem] = useState<SourceColumn | null>(null);
    const [newTableName, setNewTableName] = useState<string>('');
    const [newColumnName, setNewColumnName] = useState<string>('');
    const [selectedTableId, setSelectedTableId] = useState<string>('');

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

    const addTable = useCallback((): void => {
        if (newTableName.trim()) {
            const newTable: DestinationTable = {
                id: Date.now().toString(),
                name: newTableName.trim(),
                columns: []
            };
            setDestinationTables(prev => [...prev, newTable]);
            setNewTableName('');
        }
    }, [newTableName]);

    const addColumn = useCallback((): void => {
        if (newColumnName.trim() && selectedTableId) {
            setDestinationTables(prev =>
                prev.map(table =>
                    table.id === selectedTableId
                        ? { ...table, columns: [...table.columns, newColumnName.trim()] }
                        : table
                )
            );
            setNewColumnName('');
        }
    }, [newColumnName, selectedTableId]);

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

    const exportMappings = useCallback((): void => {
        const mappingData: MappingExport = {
            mappings: mappings,
            destinationTables: destinationTables,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(mappingData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mapping_result.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [mappings, destinationTables]);

    // Upload schema JSON
    const handleFileUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target?.result as string);
                    setJsonData(parsed);
                } catch {
                    alert("Invalid JSON format");
                }
            };
            reader.readAsText(file);
        },
        []
    );

    const renderDataStructure = useCallback(() => {
        return (
            <div className="space-y-4">
                {jsonData.map((fileData, fileIndex) => {
                    const fileName = fileData.file.split('\\').pop() || fileData.file;
                    const fileKey = `file-${fileIndex}`;

                    return (
                        <div key={fileIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {/* File Header */}
                            <div
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                                onClick={() => toggleNode(fileKey)}
                            >
                                <div className="flex items-center">
                                    {expandedNodes.has(fileKey) ?
                                        <ChevronDown className="w-5 h-5 text-blue-600 mr-2" /> :
                                        <ChevronRight className="w-5 h-5 text-blue-600 mr-2" />
                                    }
                                    <File className="w-5 h-5 text-blue-600 mr-3" />
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-lg">{fileName}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{fileData.file}</p>
                                        <div className="flex items-center mt-2">
                                            <Sheet className="w-4 h-4 text-gray-400 mr-1" />
                                            <span className="text-sm text-gray-600">{fileData.sheets.length} sheets</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sheets Content */}
                            {expandedNodes.has(fileKey) && (
                                <div className="p-4">
                                    <div className="space-y-3">
                                        {fileData.sheets.map((sheet, sheetIndex) => {
                                            const sheetKey = `${fileKey}-sheet-${sheetIndex}`;
                                            const hasColumns = sheet.columns && sheet.columns.length > 0;

                                            return (
                                                <div key={sheetIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    {/* Sheet Header */}
                                                    <div
                                                        className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                                        onClick={() => toggleNode(sheetKey)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                {hasColumns ? (
                                                                    expandedNodes.has(sheetKey) ?
                                                                        <ChevronDown className="w-4 h-4 text-gray-600 mr-2" /> :
                                                                        <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                                                                ) : (
                                                                    <div className="w-4 h-4 mr-2" />
                                                                )}
                                                                <Sheet className="w-4 h-4 text-gray-600 mr-2" />
                                                                <span className="font-medium text-gray-800">{sheet.sheet_name}</span>
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
    }, [jsonData, expandedNodes, handleDragStart, toggleNode, isColumnMapped, getColumnMappingCount]);

    return (
        <div className="h-screen flex bg-gray-50">
            {/* JSON Source Panel */}
            <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    <h2 className="text-lg font-semibold">Source Data Structure</h2>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                        {/*<div className="text-sm text-blue-800 mb-2 font-medium">💡 How to use:</div>*/}
                        {/*<div className="text-sm text-blue-700 mb-1">• Click on files to expand sheets, then drag column names to destination tables</div>*/}
                        {/*<div className="text-sm text-blue-700 mb-1">• <span className="text-green-600 font-medium">Green columns</span> = Available for mapping</div>*/}
                        {/*<div className="text-sm text-blue-700">• <span className="text-red-600 font-medium">Red columns</span> = Already mapped</div>*/}
                        <input
                            type="file"
                            accept="application/json"
                            onChange={handleFileUpload}
                            className="mb-4"
                        />
                    </div>
                    {renderDataStructure()}
                </div>
            </div>

            {/* Destination Tables Panel */}
            <div className="w-1/2 flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Table className="w-5 h-5 mr-2" />
                        <h2 className="text-lg font-semibold">Destination Tables</h2>
                    </div>
                    <button
                        onClick={exportMappings}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm flex items-center transition-colors"
                    >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                    </button>
                </div>

                {/* Add Table Form */}
                <div className="bg-gray-100 p-4 border-b">
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="New table name"
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                            className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={addTable}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Table
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select table</option>
                            {destinationTables.map(table => (
                                <option key={table.id} value={table.id}>{table.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="New column name"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={addColumn}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Column
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    {destinationTables.map(table => (
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
                                                {table.columns.length} {table.columns.length === 1 ? 'column' : 'columns'}
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
                                ) : (
                                    <div className="space-y-3">
                                        {table.columns.map((column, index) => {
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
                    ))}

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
    );
};

export default JsonMapperVisualizer;