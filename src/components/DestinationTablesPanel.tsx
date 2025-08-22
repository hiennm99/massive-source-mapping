// components/DestinationTablesPanel.tsx - Fixed tab switching when searching
import React, {useState} from 'react';
import {Trash2, Columns, Search, X, Users, Shield, Home} from 'lucide-react';
import {useDestinationTables} from '../hooks/useDestinationTables';
import type {DestinationTable, ColumnMapping} from '../types';
import {formatColumnName} from "../utils/helpers.ts";


interface ColumnGroup {
    name: string;
    prefix: string;
    columns: string[];
    icon: React.ReactNode;
    color: string;
    instanceNumber?: number;
}

interface TabGroup {
    key: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    groups: ColumnGroup[];
}

interface DestinationTablesPanelProps {
    destinationTables: DestinationTable[],
    mappings: ColumnMapping[],
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
    onDrop: (e: React.DragEvent<HTMLDivElement>, destinationTable: DestinationTable, destinationColumn: string) => void,
    onRemoveMapping: (mappingId: number) => void,
    globalFilter: string,
    onGlobalFilterChange: (value: string) => void,
    getFilteredColumns?: (table: DestinationTable) => string[]
}

export const DestinationTablesPanel: React.FC<DestinationTablesPanelProps> = ({
                                                                                  mappings,
                                                                                  onDragOver,
                                                                                  onDrop,
                                                                                  onRemoveMapping,
                                                                                  globalFilter,
                                                                                  onGlobalFilterChange,
                                                                                  getFilteredColumns
                                                                              }) => {
    const {
        destinationTables,
        config,
        addGuarantorSlot,
        addJointSlot,
        addAssetSlot,
    } = useDestinationTables();

    const [activeMainTab, setActiveMainTab] = useState<string>('general');
    const [activeSubTab, setActiveSubTab] = useState<{ [key: string]: string }>({});
    const [isUserManuallySelectedTab, setIsUserManuallySelectedTab] = useState<boolean>(false);

    const setActiveSubTabForMain = (mainTab: string, subTab: string) => {
        setActiveSubTab(prev => ({
            ...prev,
            [mainTab]: subTab
        }));
    };

    const groupColumns = (columns: string[]): TabGroup[] => {
        const groups: { [key: string]: ColumnGroup } = {};

        // Separate main columns from prefixed columns
        const mainColumns: string[] = [];

        columns.forEach(column => {
            const guarantorMatch = column.match(/^guarantor_(\d+)_(.+)$/);
            const jointMatch = column.match(/^joint_(\d+)_(.+)$/);
            const assetMatch = column.match(/^asset_(\d+)_(.+)$/);

            if (guarantorMatch) {
                const number = parseInt(guarantorMatch[1]);
                const groupKey = `guarantor_${number}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        name: `Guarantor ${number}`,
                        prefix: groupKey,
                        columns: [],
                        icon: <Shield className="w-4 h-4"/>,
                        color: 'green',
                        instanceNumber: number
                    };
                }
                groups[groupKey].columns.push(column);
            } else if (jointMatch) {
                const number = parseInt(jointMatch[1]);
                const groupKey = `joint_${number}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        name: `Joint Borrower ${number}`,
                        prefix: groupKey,
                        columns: [],
                        icon: <Users className="w-4 h-4"/>,
                        color: 'purple',
                        instanceNumber: number
                    };
                }
                groups[groupKey].columns.push(column);
            } else if (assetMatch) {
                const number = parseInt(assetMatch[1]);
                const groupKey = `asset_${number}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        name: `Asset ${number}`,
                        prefix: groupKey,
                        columns: [],
                        icon: <Home className="w-4 h-4"/>,
                        color: 'orange',
                        instanceNumber: number
                    };
                }
                groups[groupKey].columns.push(column);
            } else {
                mainColumns.push(column);
            }
        });

        // Group by main categories
        const guarantorGroups = Object.values(groups).filter(g => g.prefix.startsWith('guarantor_')).sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0));
        const jointGroups = Object.values(groups).filter(g => g.prefix.startsWith('joint_')).sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0));
        const assetGroups = Object.values(groups).filter(g => g.prefix.startsWith('asset_')).sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0));

        const tabGroups: TabGroup[] = [
            {
                key: 'general',
                name: 'General',
                icon: <Users className="w-5 h-5"/>,
                color: 'blue',
                groups: [{
                    name: 'Main Borrower',
                    prefix: 'main',
                    columns: mainColumns,
                    icon: <Users className="w-4 h-4"/>,
                    color: 'blue'
                }]
            }
        ];

        if (guarantorGroups.length > 0) {
            tabGroups.push({
                key: 'guarantors',
                name: 'Guarantors',
                icon: <Shield className="w-5 h-5"/>,
                color: 'green',
                groups: guarantorGroups
            });
        }

        if (jointGroups.length > 0) {
            tabGroups.push({
                key: 'joints',
                name: 'Joint Borrowers',
                icon: <Users className="w-5 h-5"/>,
                color: 'purple',
                groups: jointGroups
            });
        }

        if (assetGroups.length > 0) {
            tabGroups.push({
                key: 'assets',
                name: 'Assets',
                icon: <Home className="w-5 h-5"/>,
                color: 'orange',
                groups: assetGroups
            });
        }

        return tabGroups;
    };

    const table = destinationTables[0];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const filteredColumns = getFilteredColumns(table);
    const tabGroups = groupColumns(filteredColumns);

    // Auto-switch tab based on search - ONLY if user hasn't manually selected
    React.useEffect(() => {
        if (globalFilter.trim() && !isUserManuallySelectedTab) {
            // Find which tab has the most matching results
            let bestTab = activeMainTab;
            let maxMatches = 0;

            tabGroups.forEach(tabGroup => {
                const tabMatches = tabGroup.groups.reduce((count, group) => {
                    return count + group.columns.filter(col => filteredColumns.includes(col)).length;
                }, 0);

                if (tabMatches > maxMatches) {
                    maxMatches = tabMatches;
                    bestTab = tabGroup.key;
                }
            });

            // Switch to the tab with most matches if it's different and has results
            if (bestTab !== activeMainTab && maxMatches > 0) {
                setActiveMainTab(bestTab);
                // Also set the first sub-tab if needed
                const targetTabGroup = tabGroups.find(tg => tg.key === bestTab);
                if (targetTabGroup && targetTabGroup.groups.length > 0 && bestTab !== 'general') {
                    setActiveSubTabForMain(bestTab, targetTabGroup.groups[0].prefix);
                }
            }
        }

        // Reset manual selection flag when search is cleared
        if (!globalFilter.trim()) {
            setIsUserManuallySelectedTab(false);
        }
    }, [globalFilter, filteredColumns, isUserManuallySelectedTab]);

    // Manual tab click handler
    const handleTabClick = (tabKey: string) => {
        setActiveMainTab(tabKey);
        setIsUserManuallySelectedTab(true); // Mark as manually selected
        // Set default sub-tab when switching manually
        const targetTabGroup = tabGroups.find(tg => tg.key === tabKey);
        if (targetTabGroup && targetTabGroup.groups.length > 0 && tabKey !== 'general') {
            const currentSubTab = activeSubTab[tabKey];
            // Only set first sub-tab if no sub-tab is currently selected for this main tab
            if (!currentSubTab) {
                setActiveSubTabForMain(tabKey, targetTabGroup.groups[0].prefix);
            }
        }
    };

    const activeTabGroup = tabGroups.find(tg => tg.key === activeMainTab);

    // When searching, show results organized by subtabs, not all mixed together
    let activeGroup: ColumnGroup | undefined;
    let columnsToShow: string[] = [];

    if (globalFilter.trim()) {
        // When filtering, show results but maintain subtab structure
        if (activeTabGroup) {
            if (activeMainTab === 'general') {
                // For general tab, show all matching main columns
                const mainGroup = activeTabGroup.groups.find(g => g.prefix === 'main');
                if (mainGroup) {
                    columnsToShow = mainGroup.columns.filter(col => filteredColumns.includes(col));
                    activeGroup = {
                        name: `Main Borrower Results`,
                        prefix: 'main_results',
                        columns: columnsToShow,
                        icon: mainGroup.icon,
                        color: mainGroup.color
                    };
                }
            } else {
                // For other tabs, show current subtab's matching columns
                const currentSubTab = activeSubTab[activeMainTab];
                let targetGroup = activeTabGroup.groups.find(g => g.prefix === currentSubTab);

                // If no subtab selected, use first group
                if (!targetGroup && activeTabGroup.groups.length > 0) {
                    targetGroup = activeTabGroup.groups[0];
                    setActiveSubTabForMain(activeMainTab, targetGroup.prefix);
                }

                if (targetGroup) {
                    columnsToShow = targetGroup.columns.filter(col => filteredColumns.includes(col));
                    activeGroup = {
                        name: `${targetGroup.name} Results`,
                        prefix: `${targetGroup.prefix}_results`,
                        columns: columnsToShow,
                        icon: targetGroup.icon,
                        color: targetGroup.color
                    };
                }
            }
        }
    } else {
        // Normal behavior when not filtering
        activeGroup = activeTabGroup?.groups.find(g => {
            if (activeMainTab === 'general') return g.prefix === 'main';
            return g.prefix === activeSubTab[activeMainTab];
        }) || activeTabGroup?.groups[0];

        columnsToShow = activeGroup?.columns || [];
    }

    return (
        <div className="w-full flex flex-col h-screen bg-gray-100">
            {/* Search Bar */}
            <div className="bg-white p-4 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                    <input
                        type="text"
                        placeholder="Search all columns across all groups..."
                        value={globalFilter}
                        onChange={(e) => onGlobalFilterChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                    {globalFilter && (
                        <button
                            onClick={() => onGlobalFilterChange('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600"/>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="flex">
                    {tabGroups.map((tabGroup) => {
                        // Count matching columns in this tab
                        const matchingCount = globalFilter.trim() ?
                            tabGroup.groups.reduce((count, group) => {
                                return count + group.columns.filter(col => filteredColumns.includes(col)).length;
                            }, 0) : 0;

                        return (
                            <button
                                key={tabGroup.key}
                                onClick={() => handleTabClick(tabGroup.key)} // Use handler instead of direct setActiveMainTab
                                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 relative ${
                                    activeMainTab === tabGroup.key
                                        ? tabGroup.color === 'blue' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                            tabGroup.color === 'green' ? 'border-green-500 text-green-600 bg-green-50' :
                                                tabGroup.color === 'purple' ? 'border-purple-500 text-purple-600 bg-purple-50' :
                                                    tabGroup.color === 'orange' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                                                        'border-gray-500 text-gray-600 bg-gray-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className={`mr-3 ${
                                    activeMainTab === tabGroup.key
                                        ? tabGroup.color === 'blue' ? 'text-blue-600' :
                                            tabGroup.color === 'green' ? 'text-green-600' :
                                                tabGroup.color === 'purple' ? 'text-purple-600' :
                                                    tabGroup.color === 'orange' ? 'text-orange-600' :
                                                        'text-gray-600'
                                        : 'text-gray-400'
                                }`}>
                                    {tabGroup.icon}
                                </div>
                                <span className="whitespace-nowrap">{tabGroup.name}</span>
                                {tabGroup.groups.length > 1 && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-full">
                                        {tabGroup.groups.length}
                                    </span>
                                )}

                                {/* Show search result count when filtering */}
                                {globalFilter.trim() && matchingCount > 0 && (
                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                                        tabGroup.color === 'blue' ? 'bg-blue-500 text-white' :
                                            tabGroup.color === 'green' ? 'bg-green-500 text-white' :
                                                tabGroup.color === 'purple' ? 'bg-purple-500 text-white' :
                                                    tabGroup.color === 'orange' ? 'bg-orange-500 text-white' :
                                                        'bg-gray-500 text-white'
                                    }`}>
                                        {matchingCount}
                                    </span>
                                )}

                                {/* Highlight tab with search results */}
                                {globalFilter.trim() && matchingCount > 0 && activeMainTab !== tabGroup.key && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sub-tabs Navigation - Show even when searching to maintain context */}
            {activeTabGroup && activeTabGroup.groups.length >= 1 && activeTabGroup.key !== 'general' && (
                <div className={
                    activeTabGroup.color === 'blue' ? 'bg-blue-50 border-b border-blue-200' :
                        activeTabGroup.color === 'green' ? 'bg-green-50 border-b border-green-200' :
                            activeTabGroup.color === 'purple' ? 'bg-purple-50 border-b border-purple-200' :
                                activeTabGroup.color === 'orange' ? 'bg-orange-50 border-b border-orange-200' :
                                    'bg-gray-50 border-b border-gray-200'
                }>
                    <div className="flex overflow-x-auto px-6">
                        {activeTabGroup.groups.map((group) => {
                            // Check if this group has any mappings
                            const groupHasMappings = group.columns.some(column =>
                                mappings.some(m =>
                                    m.destination.table === table.name && m.destination.column === column
                                )
                            );

                            // Count search results for this subtab
                            const searchResultsCount = globalFilter.trim() ?
                                group.columns.filter(col => filteredColumns.includes(col)).length : 0;

                            return (
                                <button
                                    key={group.prefix}
                                    onClick={() => setActiveSubTabForMain(activeMainTab, group.prefix)}
                                    className={`relative flex-shrink-0 flex items-center px-4 py-3 mx-1 text-sm font-medium transition-all duration-300 transform ${
                                        activeSubTab[activeMainTab] === group.prefix
                                            ? activeTabGroup.color === 'blue' ? 'text-blue-700 bg-white shadow-md border-2 border-blue-300 rounded-lg scale-105 font-semibold' :
                                                activeTabGroup.color === 'green' ? 'text-green-700 bg-white shadow-md border-2 border-green-300 rounded-lg scale-105 font-semibold' :
                                                    activeTabGroup.color === 'purple' ? 'text-purple-700 bg-white shadow-md border-2 border-purple-300 rounded-lg scale-105 font-semibold' :
                                                        activeTabGroup.color === 'orange' ? 'text-orange-700 bg-white shadow-md border-2 border-orange-300 rounded-lg scale-105 font-semibold' :
                                                            'text-gray-700 bg-white shadow-md border-2 border-gray-300 rounded-lg scale-105 font-semibold'
                                            : groupHasMappings
                                                ? activeTabGroup.color === 'blue' ? 'text-blue-700 bg-blue-200 hover:bg-blue-300 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-blue-400 shadow-sm' :
                                                    activeTabGroup.color === 'green' ? 'text-green-700 bg-green-200 hover:bg-green-300 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-green-400 shadow-sm' :
                                                        activeTabGroup.color === 'purple' ? 'text-purple-700 bg-purple-200 hover:bg-purple-300 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-purple-400 shadow-sm' :
                                                            activeTabGroup.color === 'orange' ? 'text-orange-700 bg-orange-200 hover:bg-orange-300 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-orange-400 shadow-sm' :
                                                                'text-gray-700 bg-gray-200 hover:bg-gray-300 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-gray-400 shadow-sm'
                                                : activeTabGroup.color === 'blue' ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-100 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-transparent' :
                                                    activeTabGroup.color === 'green' ? 'text-green-600 hover:text-green-700 hover:bg-green-100 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-transparent' :
                                                        activeTabGroup.color === 'purple' ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-100 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-transparent' :
                                                            activeTabGroup.color === 'orange' ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-100 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-transparent' :
                                                                'text-gray-600 hover:text-gray-700 hover:bg-gray-100 hover:shadow-sm hover:scale-102 rounded-lg border-2 border-transparent'
                                    }`}
                                >
                                    {/* Active indicator */}
                                    {activeSubTab[activeMainTab] === group.prefix && (
                                        <div
                                            className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${
                                                activeTabGroup.color === 'blue' ? 'bg-blue-500' :
                                                    activeTabGroup.color === 'green' ? 'bg-green-500' :
                                                        activeTabGroup.color === 'purple' ? 'bg-purple-500' :
                                                            activeTabGroup.color === 'orange' ? 'bg-orange-500' :
                                                                'bg-gray-500'
                                            } animate-pulse`}/>
                                    )}

                                    {/* Mapping indicator - small dot for non-active tabs */}
                                    {groupHasMappings && activeSubTab[activeMainTab] !== group.prefix && (
                                        <div
                                            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                                activeTabGroup.color === 'blue' ? 'bg-blue-500' :
                                                    activeTabGroup.color === 'green' ? 'bg-green-500' :
                                                        activeTabGroup.color === 'purple' ? 'bg-purple-500' :
                                                            activeTabGroup.color === 'orange' ? 'bg-orange-500' :
                                                                'bg-gray-500'
                                            }`}>
                                            <div
                                                className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                                <div className="w-1 h-1 bg-current rounded-full"></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`mr-2 transition-transform duration-300 ${
                                        activeSubTab[activeMainTab] === group.prefix ? 'scale-110' : ''
                                    }`}>
                                        {group.icon}
                                    </div>
                                    <span className="whitespace-nowrap">{group.name}</span>

                                    {/* Show search results count when filtering */}
                                    {globalFilter.trim() && searchResultsCount > 0 ? (
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium transition-all duration-300 ${
                                            activeSubTab[activeMainTab] === group.prefix
                                                ? activeTabGroup.color === 'blue' ? 'bg-blue-500 text-white shadow-sm' :
                                                    activeTabGroup.color === 'green' ? 'bg-green-500 text-white shadow-sm' :
                                                        activeTabGroup.color === 'purple' ? 'bg-purple-500 text-white shadow-sm' :
                                                            activeTabGroup.color === 'orange' ? 'bg-orange-500 text-white shadow-sm' :
                                                                'bg-gray-500 text-white shadow-sm'
                                                : 'bg-yellow-500 text-white shadow-sm'
                                        }`}>
                                            {searchResultsCount}
                                        </span>
                                    ) : (
                                        /* Column count badge for normal mode */
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full transition-all duration-300 ${
                                            activeSubTab[activeMainTab] === group.prefix
                                                ? activeTabGroup.color === 'blue' ? 'bg-blue-500 text-white shadow-sm' :
                                                    activeTabGroup.color === 'green' ? 'bg-green-500 text-white shadow-sm' :
                                                        activeTabGroup.color === 'purple' ? 'bg-purple-500 text-white shadow-sm' :
                                                            activeTabGroup.color === 'orange' ? 'bg-orange-500 text-white shadow-sm' :
                                                                'bg-gray-500 text-white shadow-sm'
                                                : groupHasMappings
                                                    ? activeTabGroup.color === 'blue' ? 'bg-blue-600 text-white shadow-sm' :
                                                        activeTabGroup.color === 'green' ? 'bg-green-600 text-white shadow-sm' :
                                                            activeTabGroup.color === 'purple' ? 'bg-purple-600 text-white shadow-sm' :
                                                                activeTabGroup.color === 'orange' ? 'bg-orange-600 text-white shadow-sm' :
                                                                    'bg-gray-600 text-white shadow-sm'
                                                    : 'bg-white bg-opacity-70 text-gray-600'
                                        }`}>
                                            {/*{group.columns.length}*/}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {/* Add button at the end of subtabs */}
                        <button
                            onClick={() => {
                                if (activeTabGroup.key === 'guarantors') addGuarantorSlot();
                                if (activeTabGroup.key === 'joints') addJointSlot();
                                if (activeTabGroup.key === 'assets') addAssetSlot();
                            }}
                            disabled={
                                (activeTabGroup.key === 'guarantors' && config.maxGuarantors >= 10) ||
                                (activeTabGroup.key === 'joints' && config.maxJointBorrowers >= 10) ||
                                (activeTabGroup.key === 'assets' && config.maxAssets >= 10)
                            }
                            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 mx-1 my-2 text-sm font-medium rounded-full border-2 border-dashed transition-all duration-300 ${
                                activeTabGroup.color === 'blue' ? 'border-blue-300 text-blue-500 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-600' :
                                    activeTabGroup.color === 'green' ? 'border-green-300 text-green-500 hover:bg-green-100 hover:border-green-400 hover:text-green-600' :
                                        activeTabGroup.color === 'purple' ? 'border-purple-300 text-purple-500 hover:bg-purple-100 hover:border-purple-400 hover:text-purple-600' :
                                            activeTabGroup.color === 'orange' ? 'border-orange-300 text-orange-500 hover:bg-orange-100 hover:border-orange-400 hover:text-orange-600' :
                                                'border-gray-300 text-gray-500 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105`}
                            title={`Add new ${activeTabGroup.name.toLowerCase().slice(0, -1)}`}
                        >
                            +
                        </button>
                    </div>
                </div>
            )}

            {/* Active Content */}
            <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
                {activeGroup && (
                    <div>
                        {/* Show search info when filtering */}
                        {globalFilter.trim() && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Search className="w-4 h-4 text-blue-600"/>
                                    <span className="text-sm text-blue-700">
                                        Showing {columnsToShow.length} results for "{globalFilter}" in {activeGroup?.name || activeTabGroup?.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Columns Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {columnsToShow.map((column, index) => {
                                const columnMappings = mappings.filter(m =>
                                    m.destination.table === table.name && m.destination.column === column
                                );

                                // Clean column display name
                                const displayColumn = formatColumnName(column);

                                return (
                                    <div
                                        key={index}
                                        className={`bg-white rounded-lg border-2 ${columnMappings.length > 0 ? 'border-green-300 bg-green-50' : 'border-gray-200'} p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer`}
                                        onDragOver={onDragOver}
                                        onDrop={(e) => onDrop(e, table, column)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={
                                                activeGroup.color === 'blue' ? 'bg-blue-100 p-2 rounded-lg' :
                                                    activeGroup.color === 'green' ? 'bg-green-100 p-2 rounded-lg' :
                                                        activeGroup.color === 'purple' ? 'bg-purple-100 p-2 rounded-lg' :
                                                            activeGroup.color === 'orange' ? 'bg-orange-100 p-2 rounded-lg' :
                                                                'bg-gray-100 p-2 rounded-lg'
                                            }>
                                                <Columns className={
                                                    activeGroup.color === 'blue' ? 'w-4 h-4 text-blue-600' :
                                                        activeGroup.color === 'green' ? 'w-4 h-4 text-green-600' :
                                                            activeGroup.color === 'purple' ? 'w-4 h-4 text-purple-600' :
                                                                activeGroup.color === 'orange' ? 'w-4 h-4 text-orange-600' :
                                                                    'w-4 h-4 text-gray-600'
                                                }/>
                                            </div>
                                            {columnMappings.length > 0 && (
                                                <div className="bg-green-100 px-2 py-1 rounded-full">
                                                    <span className="text-green-700 text-xs font-medium">
                                                        ✓ {columnMappings.length}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-2">
                                            <h4 className="font-semibold text-gray-900 text-sm mb-1" title={column}>
                                                {displayColumn}
                                            </h4>
                                            {/* Show which group this column belongs to when searching */}
                                            {globalFilter.trim() && (
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {column.startsWith('guarantor_') ? 'Guarantor' :
                                                        column.startsWith('joint_') ? 'Joint Borrower' :
                                                            column.startsWith('asset_') ? 'Asset' : 'Main Borrower'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Show mappings if any */}
                                        {columnMappings.length > 0 && (
                                            <div className="space-y-2">
                                                {columnMappings.map(mapping => (
                                                    <div key={mapping.id} className={
                                                        activeGroup.color === 'blue' ? 'bg-blue-50 border border-blue-200 rounded p-2 text-xs' :
                                                            activeGroup.color === 'green' ? 'bg-green-50 border border-green-200 rounded p-2 text-xs' :
                                                                activeGroup.color === 'purple' ? 'bg-purple-50 border border-purple-200 rounded p-2 text-xs' :
                                                                    activeGroup.color === 'orange' ? 'bg-orange-50 border border-orange-200 rounded p-2 text-xs' :
                                                                        'bg-gray-50 border border-gray-200 rounded p-2 text-xs'
                                                    }>
                                                        <div className="flex items-start justify-between">
                                                            <div className={
                                                                activeGroup.color === 'blue' ? 'flex-1 min-w-0 text-blue-700' :
                                                                    activeGroup.color === 'green' ? 'flex-1 min-w-0 text-green-700' :
                                                                        activeGroup.color === 'purple' ? 'flex-1 min-w-0 text-purple-700' :
                                                                            activeGroup.color === 'orange' ? 'flex-1 min-w-0 text-orange-700' :
                                                                                'flex-1 min-w-0 text-gray-700'
                                                            }>
                                                                <div
                                                                    className="font-medium truncate mb-1">{mapping.source.value}</div>
                                                                <div className={
                                                                    activeGroup.color === 'blue' ? 'text-blue-500 text-[10px] truncate' :
                                                                        activeGroup.color === 'green' ? 'text-green-500 text-[10px] truncate' :
                                                                            activeGroup.color === 'purple' ? 'text-purple-500 text-[10px] truncate' :
                                                                                activeGroup.color === 'orange' ? 'text-orange-500 text-[10px] truncate' :
                                                                                    'text-gray-500 text-[10px] truncate'
                                                                }>
                                                                    {mapping.source.file} → {mapping.source.sheet}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => onRemoveMapping(mapping.id)}
                                                                className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
                                                                title="Remove mapping"
                                                            >
                                                                <Trash2 className="w-3 h-3"/>
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
                    </div>
                )}
            </div>
        </div>
    );
};