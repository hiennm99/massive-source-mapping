// components/DestinationTablesPanel.tsx - Grouped columns layout
import React, { useState } from 'react';
import { Table, Trash2, Columns, Search, X, ChevronDown, ChevronUp, Users, Shield, Home } from 'lucide-react';
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

interface ColumnGroup {
    name: string;
    prefix: string;
    columns: string[];
    icon: React.ReactNode;
    color: string;
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
    // State to track expanded groups
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleGroupExpansion = (groupKey: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedGroups(newExpanded);
    };

    const COLUMNS_LIMIT = 8;

    // Group columns by prefix
    const groupColumns = (columns: string[]): ColumnGroup[] => {
        const groups: { [key: string]: ColumnGroup } = {};

        // Define group configurations
        const groupConfigs = {
            main: {
                name: 'General',
                icon: <Users className="w-4 h-4" />,
                color: 'blue'
            },
            guarantor: {
                name: 'Guarantor',
                icon: <Shield className="w-4 h-4" />,
                color: 'green'
            },
            joint: {
                name: 'Joint',
                icon: <Users className="w-4 h-4" />,
                color: 'purple'
            },
            asset: {
                name: 'Asset',
                icon: <Home className="w-4 h-4" />,
                color: 'orange'
            }
        };

        columns.forEach(column => {
            let groupKey = 'main'; // default group

            // Determine group based on prefix
            if (column.startsWith('guarantor_')) {
                groupKey = 'guarantor';
                column.replace('guarantor_', '');
            } else if (column.startsWith('joint_')) {
                groupKey = 'joint';
                column.replace('joint_', '');
            } else if (['asset_id', 'type', 'last_evaluation_amount', 'last_evaluation_date', 'sheet', 'particle', 'sub', 'category', 'square_meter', 'vain'].includes(column)) {
                groupKey = 'asset';
            }

            if (!groups[groupKey]) {
                const config = groupConfigs[groupKey as keyof typeof groupConfigs];
                groups[groupKey] = {
                    name: config.name,
                    prefix: groupKey,
                    columns: [],
                    icon: config.icon,
                    color: config.color
                };
            }

            groups[groupKey].columns.push(column);
        });

        return Object.values(groups);
    };

    return (
        <div className="w-full flex flex-col h-full">
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
                {destinationTables.map((table) => {
                    const filteredColumns = getFilteredColumns(table);
                    const columnGroups = groupColumns(filteredColumns);

                    if (globalFilter && filteredColumns.length === 0) {
                        return null;
                    }

                    return (
                        <div key={table.id} className="mb-6">
                            {/* Table Header */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                                            <Table className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 text-lg">{table.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {filteredColumns.length} {filteredColumns.length === 1 ? 'column' : 'columns'}
                                                in {columnGroups.length} {columnGroups.length === 1 ? 'group' : 'groups'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Groups Container - Horizontal Layout */}
                            <div className="flex gap-4 flex-1 min-h-[500px] overflow-x-auto">
                                {columnGroups.map((group) => {
                                    const groupKey = `${table.id}-${group.prefix}`;
                                    const isExpanded = expandedGroups.has(groupKey);
                                    const shouldShowExpandButton = group.columns.length > COLUMNS_LIMIT;
                                    const visibleColumns = isExpanded ? group.columns : group.columns.slice(0, COLUMNS_LIMIT);
                                    const hiddenCount = group.columns.length - COLUMNS_LIMIT;

                                    return (
                                        <div key={group.prefix} className="flex-shrink-0 w-60 flex flex-col">
                                            {/* Group Header */}
                                            <div className={`bg-${group.color}-50 border border-${group.color}-200 rounded-t-lg p-3`}>
                                                <div className="flex items-center">
                                                    <div className={`bg-${group.color}-100 p-2 rounded-lg mr-3`}>
                                                        {group.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-semibold text-${group.color}-800`}>{group.name}</h4>
                                                        <p className={`text-xs text-${group.color}-600`}>
                                                            {group.columns.length} {group.columns.length === 1 ? 'column' : 'columns'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Columns Container */}
                                            <div className="flex-1 bg-white border-l border-r border-gray-200 overflow-y-auto">
                                                <div className="p-3 space-y-2">
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
                                                                    <div className={`bg-${group.color}-100 p-1.5 rounded mr-2`}>
                                                                        <Columns className={`w-3 h-3 text-${group.color}-600`} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-gray-800 text-sm truncate">{column}</div>
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
                                                                            <div key={mapping.id} className={`bg-${group.color}-50 rounded p-2 text-xs`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className={`flex-1 min-w-0 text-${group.color}-700`}>
                                                                                        <div className="font-medium truncate">{mapping.source.value}</div>
                                                                                        <div className={`text-${group.color}-500 text-[10px] truncate`}>
                                                                                            {mapping.source.file} → {mapping.source.sheet}
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => onRemoveMapping(mapping.id)}
                                                                                        className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
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
                                                            onClick={() => toggleGroupExpansion(groupKey)}
                                                            className={`w-full bg-white border-2 border-dashed border-${group.color}-300 rounded-lg p-2 hover:border-${group.color}-400 hover:bg-${group.color}-50 transition-all duration-200 flex items-center justify-center`}
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
                                                                        +{hiddenCount} more
                                                                    </span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Group Footer */}
                                            <div className={`bg-${group.color}-50 border border-${group.color}-200 rounded-b-lg p-2 text-center`}>
                                                <span className={`text-xs text-${group.color}-600 font-medium`}>
                                                    {group.prefix.toUpperCase()} GROUP
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Empty state */}
                {destinationTables.length === 0 && (
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-12">
                        <div className="text-center">
                            <Table className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-gray-500 font-medium mb-2">No destination tables</h3>
                            <p className="text-gray-400 text-sm">Create your first table to get started</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};