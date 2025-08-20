// components/DestinationTablesPanel.tsx - Destination tables rendering
import React from 'react';
import { Table, Trash2, Columns, Search, X } from 'lucide-react';
import type {DestinationTable, ColumnMapping} from '../types';

interface DestinationTablesPanelProps {
    destinationTables: DestinationTable[];
    mappings: ColumnMapping[];
    globalFilter: string;
    onGlobalFilterChange: (value: string) => void;
    getFilteredColumns: (table: DestinationTable) => string[];
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, destinationTable: DestinationTable, destinationColumn: string) => void;
    onRemoveTable: (tableId: string) => void;
    onRemoveColumn: (tableId: string, column: string) => void;
    onRemoveMapping: (mappingId: number) => void;
}

export const DestinationTablesPanel: React.FC<DestinationTablesPanelProps> = ({
                                                                                  destinationTables,
                                                                                  mappings,
                                                                                  globalFilter,
                                                                                  onGlobalFilterChange,
                                                                                  getFilteredColumns,
                                                                                  onDragOver,
                                                                                  onDrop,
                                                                                  // onRemoveTable,
                                                                                  // onRemoveColumn,
                                                                                  onRemoveMapping
                                                                              }) => {
    return (
        <div className="w-1/2 flex flex-col">
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
                        onChange={(e) => onGlobalFilterChange(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
                    />
                    {globalFilter && (
                        <button
                            onClick={() => onGlobalFilterChange('')}
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
                                    {/*<button*/}
                                    {/*    onClick={() => onRemoveTable(table.id)}*/}
                                    {/*    className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-2 rounded-lg transition-all duration-200"*/}
                                    {/*    title="Delete table"*/}
                                    {/*>*/}
                                    {/*    <Trash2 className="w-4 h-4" />*/}
                                    {/*</button>*/}
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
                                                    onDragOver={onDragOver}
                                                    onDrop={(e) => onDrop(e, table, column)}
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
                                                        {/*<button*/}
                                                        {/*    onClick={() => onRemoveColumn(table.id, column)}*/}
                                                        {/*    className="opacity-0 group-hover:opacity-100 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-1.5 rounded-lg transition-all duration-200"*/}
                                                        {/*    title="Delete column"*/}
                                                        {/*>*/}
                                                        {/*    <Trash2 className="w-4 h-4" />*/}
                                                        {/*</button>*/}
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
                                                                            onClick={() => onRemoveMapping(mapping.id)}
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
    );
};