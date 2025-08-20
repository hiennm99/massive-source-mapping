// components/SourceDataPanel.tsx - Source data structure rendering
import { ChevronRight, ChevronDown, Database, File, Sheet, Columns, Check } from 'lucide-react';
import type {FileData, SourceColumn} from '../types';

interface SourceDataPanelProps {
    jsonData: FileData[];
    expandedNodes: Set<string>;
    onToggleNode: (path: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, item: SourceColumn) => void;
    isFileMapped: (fileName: string) => boolean;
    isSheetMapped: (fileName: string, sheetName: string) => boolean;
    getFileMappingCount: (fileName: string) => number;
    getSheetMappingCount: (fileName: string, sheetName: string) => number;
    isColumnMapped: (fileName: string, sheetName: string, columnName: string) => boolean;
    getColumnMappingCount: (fileName: string, sheetName: string, columnName: string) => number;
}

export const SourceDataPanel: React.FC<SourceDataPanelProps> = ({
                                                                    jsonData,
                                                                    expandedNodes,
                                                                    onToggleNode,
                                                                    onDragStart,
                                                                    isFileMapped,
                                                                    isSheetMapped,
                                                                    getFileMappingCount,
                                                                    getSheetMappingCount,
                                                                    isColumnMapped,
                                                                    getColumnMappingCount
                                                                }) => {
    return (
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
            <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-700 text-white p-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">Source Data Structure</h2>
            </div>
            <div className="flex-1 overflow-auto p-4">
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
                                    onClick={() => onToggleNode(fileKey)}
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
                                                            onClick={() => onToggleNode(sheetKey)}
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
                                                                                onDragStart={(e) => onDragStart(e, {
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
            </div>
        </div>
    );
};