// components/DestinationTablesPanel.tsx - Clean horizontal layout with expand/collapse
import React, { useState } from 'react';
import { Table, Trash2, Columns, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
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
                                                                                  onRemoveMapping
                                                                              }) => {
    // State to track expanded tables
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

    const toggleTableExpansion = (tableId: string) => {
        const newExpanded = new Set(expandedTables);
        if (newExpanded.has(tableId)) {
            newExpanded.delete(tableId);
        } else {
            newExpanded.add(tableId);
        }
        setExpandedTables(newExpanded);
    };

    const COLUMNS_LIMIT = 8;
    return (
        <div className="w-1/2 flex flex-col h-full">
            {/* Search Bar */}
            <div className="bg-white p-4 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search all columns across all tables..."
                        value={globalFilter}
                        onChange={(e) => onGlobalFilterChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                    {globalFilter && (
                        <button
                            onClick={() => onGlobalFilterChange('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tables Container */}
            <div className="flex-1 bg-gray-50 p-4">
                <div className="flex gap-4 h-full">
                    {destinationTables.map((table) => {
                        const filteredColumns = getFilteredColumns(table);
                        const isExpanded = expandedTables.has(table.id);
                        const shouldShowExpandButton = filteredColumns.length > COLUMNS_LIMIT;
                        const visibleColumns = isExpanded ? filteredColumns : filteredColumns.slice(0, COLUMNS_LIMIT);
                        const hiddenCount = filteredColumns.length - COLUMNS_LIMIT;

                        if (globalFilter && filteredColumns.length === 0) {
                            return null;
                        }

                        return (
                            <div key={table.id} className="flex-1 flex flex-col">
                                {/* Table Header Card */}
                                <div className="bg-white rounded-t-lg border border-gray-200 p-4 mb-2">
                                    <div className="flex items-center">
                                        <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                                            <Table className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{table.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {filteredColumns.length} {filteredColumns.length === 1 ? 'column' : 'columns'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Columns Container */}
                                <div className="flex-1 space-y-2 overflow-y-auto">
                                    {filteredColumns.length === 0 ? (
                                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                            <Columns className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-400 text-sm">No columns found</p>
                                        </div>
                                    ) : (
                                        <>
                                            {visibleColumns.map((column, index) => {
                                                const columnMappings = mappings.filter(m =>
                                                    m.destination.table === table.name && m.destination.column === column
                                                );

                                                return (
                                                    <div
                                                        key={index}
                                                        className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                                        onDragOver={onDragOver}
                                                        onDrop={(e) => onDrop(e, table, column)}
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="bg-blue-100 p-1.5 rounded mr-3">
                                                                <Columns className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-800">{column}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {columnMappings.length > 0
                                                                        ? `${columnMappings.length} mapping${columnMappings.length > 1 ? 's' : ''}`
                                                                        : 'Drop here'
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Show mappings if any */}
                                                        {columnMappings.length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                {columnMappings.map(mapping => (
                                                                    <div key={mapping.id} className="bg-blue-50 rounded p-2 text-xs">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex-1 text-blue-700">
                                                                                <span className="font-medium">{mapping.source.value}</span>
                                                                                <div className="text-blue-500">
                                                                                    {mapping.source.file} → {mapping.source.sheet}
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => onRemoveMapping(mapping.id)}
                                                                                className="text-red-400 hover:text-red-600 ml-2"
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

                                            {/* Expand/Collapse Button */}
                                            {shouldShowExpandButton && (
                                                <button
                                                    onClick={() => toggleTableExpansion(table.id)}
                                                    className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 flex items-center justify-center"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp className="w-4 h-4 mr-2 text-gray-500" />
                                                            <span className="text-sm text-gray-600">Show Less</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4 mr-2 text-gray-500" />
                                                            <span className="text-sm text-gray-600">
                                                                Show {hiddenCount} More Column{hiddenCount > 1 ? 's' : ''}
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {destinationTables.length === 0 && (
                        <div className="flex-1 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center p-8">
                                <Table className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-500 font-medium mb-2">No destination tables</h3>
                                <p className="text-gray-400 text-sm">Create your first table to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};