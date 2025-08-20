// hooks/useDestinationTables.ts - Hook for managing destination tables
import { useState, useCallback } from 'react';
import type {DestinationTable} from '../types';

export const useDestinationTables = () => {
    const [destinationTables, setDestinationTables] = useState<DestinationTable[]>([
        {
            id: 'general_table',
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
            id: 'asset_table',
            name: 'asset',
            columns: [
                'asset_id', 'ndg', 'type', 'last_evaluation_amount', 'last_evaluation_date',
                'country', 'postcode', 'region', 'province', 'city', 'address',
                'sheet', 'particle', 'sub', 'category', 'square_meter', 'vain'
            ]
        }
    ]);

    // Global filter for all tables
    const [globalFilter, setGlobalFilter] = useState<string>('');

    // Filter columns based on global search term
    const getFilteredColumns = useCallback((table: DestinationTable): string[] => {
        if (!globalFilter.trim()) {
            return table.columns;
        }

        return table.columns.filter(column =>
            column.toLowerCase().includes(globalFilter.toLowerCase())
        );
    }, [globalFilter]);

    const removeTable = useCallback((tableId: string): DestinationTable | undefined => {
        const tableToRemove = destinationTables.find(table => table.id === tableId);
        setDestinationTables(prev => prev.filter(table => table.id !== tableId));

        return tableToRemove;
    }, [destinationTables]);

    const removeColumn = useCallback((tableId: string, columnToRemove: string): DestinationTable | undefined => {
        // Remove column from table
        setDestinationTables(prev =>
            prev.map(table =>
                table.id === tableId
                    ? { ...table, columns: table.columns.filter(col => col !== columnToRemove) }
                    : table
            )
        );

        // Return the table for cleanup purposes
        return destinationTables.find(t => t.id === tableId);
    }, [destinationTables]);

    return {
        destinationTables,
        setDestinationTables,
        globalFilter,
        setGlobalFilter,
        getFilteredColumns,
        removeTable,
        removeColumn
    };
};