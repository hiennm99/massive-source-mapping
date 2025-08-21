// hooks/useDestinationTables.ts - Hook for managing destination tables
import { useState, useCallback } from 'react';
import type {DestinationTable, TableConfig} from '../types';

export const useDestinationTables = () => {
    const [config, setConfig] = useState<TableConfig>({
        maxGuarantors: 3,
        maxJointBorrowers: 3,
        maxAssets: 3
    });

    // Generate columns dynamically
    const generateTable = useCallback((config: TableConfig) => {
        const baseColumns = [
            'fiscal_code', 'name', 'gender', 'dob', 'pob', 'note',
            'country', 'postcode', 'region', 'province', 'city', 'address', 'vat_number',
            'ndg', 'gbv', 'dbt_date', 'originator',
            'phone_number', 'email', 'bank_abi', 'bank_cab', 'account_number'
        ];

        const guarantorFields = [
            'fiscal_code', 'name', 'gender', 'dob', 'pob', 'note',
            'country', 'postcode', 'region', 'province', 'city', 'address', 'vat_number',
            'ndg', 'phone_number', 'email', 'type', 'limit'
        ];

        const jointFields = [
            'fiscal_code', 'name', 'gender', 'dob', 'pob', 'note',
            'country', 'postcode', 'region', 'province', 'city', 'address', 'vat_number',
            'ndg', 'phone_number', 'email'
        ];

        const assetFields = [
            'asset_id', 'type', 'last_evaluation_amount', 'last_evaluation_date',
            'country', 'postcode', 'region', 'province', 'city', 'address',
            'sheet', 'particle', 'sub', 'category', 'square_meter', 'vain'
        ];

        const columns = [...baseColumns];

        // Generate guarantor columns
        for (let i = 1; i <= config.maxGuarantors; i++) {
            guarantorFields.forEach(field => {
                columns.push(`guarantor_${i}_${field}`);
            });
        }

        // Generate joint borrower columns
        for (let i = 1; i <= config.maxJointBorrowers; i++) {
            jointFields.forEach(field => {
                columns.push(`joint_${i}_${field}`);
            });
        }

        // Generate asset columns
        for (let i = 1; i <= config.maxAssets; i++) {
            assetFields.forEach(field => {
                columns.push(`asset_${i}_${field}`);
            });
        }

        return {
            id: 'main_borrower_table',
            name: 'main_borrower',
            columns
        };
    }, []);

    const [destinationTables, setDestinationTables] = useState<DestinationTable[]>([
        generateTable(config)
    ]);

    const [globalFilter, setGlobalFilter] = useState<string>('');

    const getFilteredColumns = useCallback((table: DestinationTable): string[] => {
        if (!globalFilter.trim()) {
            return table.columns;
        }
        return table.columns.filter(column =>
            column.toLowerCase().includes(globalFilter.toLowerCase())
        );
    }, [globalFilter]);

    // Update config and regenerate table
    const updateConfig = useCallback((newConfig: Partial<TableConfig>) => {
        const updatedConfig = { ...config, ...newConfig };
        setConfig(updatedConfig);
        setDestinationTables([generateTable(updatedConfig)]);
    }, [config, generateTable]);

    const addGuarantorSlot = useCallback(() => {
        if (config.maxGuarantors < 10) {
            updateConfig({ maxGuarantors: config.maxGuarantors + 1 });
        }
    }, [config.maxGuarantors, updateConfig]);

    const removeGuarantorSlot = useCallback(() => {
        if (config.maxGuarantors > 0) {
            updateConfig({ maxGuarantors: config.maxGuarantors - 1 });
        }
    }, [config.maxGuarantors, updateConfig]);

    const addJointSlot = useCallback(() => {
        if (config.maxJointBorrowers < 5) {
            updateConfig({ maxJointBorrowers: config.maxJointBorrowers + 1 });
        }
    }, [config.maxJointBorrowers, updateConfig]);

    const removeJointSlot = useCallback(() => {
        if (config.maxJointBorrowers > 0) {
            updateConfig({ maxJointBorrowers: config.maxJointBorrowers - 1 });
        }
    }, [config.maxJointBorrowers, updateConfig]);

    const addAssetSlot = useCallback(() => {
        if (config.maxAssets < 20) {
            updateConfig({ maxAssets: config.maxAssets + 1 });
        }
    }, [config.maxAssets, updateConfig]);

    const removeAssetSlot = useCallback(() => {
        if (config.maxAssets > 0) {
            updateConfig({ maxAssets: config.maxAssets - 1 });
        }
    }, [config.maxAssets, updateConfig]);

    return {
        destinationTables,
        globalFilter,
        setGlobalFilter,
        getFilteredColumns,
        config,
        addGuarantorSlot,
        removeGuarantorSlot,
        addJointSlot,
        removeJointSlot,
        addAssetSlot,
        removeAssetSlot
    };
};