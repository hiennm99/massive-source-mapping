// hooks/useDestinationTables.ts - Hook for managing destination tables
import { useState, useCallback } from 'react';
import type {DestinationTable} from '../types';

export const useDestinationTables = () => {
    const [destinationTables, setDestinationTables] = useState<DestinationTable[]>([
        {
            id: 'main_borrower_table',
            name: 'main_borrower',
            columns: [
                'fiscal_code', 'name', 'gender', 'dob', 'pob', 'note',
                'country', 'postcode', 'region', 'province', 'city', 'address', 'vat_number',
                'ndg', 'gbv', 'dbt_date', 'originator',
                'phone_number', 'email', 'bank_abi', 'bank_cab', 'account_number',

                'guarantor_fiscal_code', 'guarantor_name', 'guarantor_gender', 'guarantor_dob', 'guarantor_pob', 'guarantor_note',
                'guarantor_country', 'guarantor_postcode', 'guarantor_region', 'guarantor_province', 'guarantor_city', 'guarantor_address', 'guarantor_vat_number',
                'guarantor_ndg',
                'guarantor_phone_number', 'guarantor_email',
                'guarantor_type', 'guarantor_limit',

                'joint_fiscal_code', 'joint_name', 'joint_gender', 'joint_dob', 'joint_pob', 'joint_note',
                'joint_country', 'joint_postcode', 'joint_region', 'joint_province', 'joint_city', 'joint_address', 'joint_vat_number',
                'joint_ndg',
                'joint_phone_number', 'joint_email',

                'asset_id', 'type', 'last_evaluation_amount', 'last_evaluation_date',
                'country', 'postcode', 'region', 'province', 'city', 'address',
                'sheet', 'particle', 'sub', 'category', 'square_meter', 'vain'

            ]
        },
        // {
        //     id: 'guarantor_borrower_table',
        //     name: 'guarantor_borrower',
        //     columns: [
        //         'guarantor_fiscal_code', 'guarantor_name', 'guarantor_gender', 'guarantor_dob', 'guarantor_pob', 'guarantor_note',
        //         'guarantor_country', 'guarantor_postcode', 'guarantor_region', 'guarantor_province', 'guarantor_city', 'guarantor_address', 'guarantor_vat_number',
        //         'guarantor_ndg',
        //         'guarantor_phone_number', 'guarantor_email',
        //         'guarantor_type', 'guarantor_limit'
        //     ]
        // },
        // {
        //     id: 'joint_borrower_table',
        //     name: 'joint_borrower',
        //     columns: [
        //         'joint_fiscal_code', 'joint_name', 'joint_gender', 'joint_dob', 'joint_pob', 'joint_note',
        //         'joint_country', 'joint_postcode', 'joint_region', 'joint_province', 'joint_city', 'joint_address', 'joint_vat_number',
        //         'joint_ndg',
        //         'joint_phone_number', 'joint_email'
        //     ]
        // },
        // {
        //     id: 'asset_table',
        //     name: 'asset',
        //     columns: [
        //         'asset_id', 'type', 'last_evaluation_amount', 'last_evaluation_date',
        //         'country', 'postcode', 'region', 'province', 'city', 'address',
        //         'sheet', 'particle', 'sub', 'category', 'square_meter', 'vain'
        //     ]
        // }
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