// src/hooks/useDestinationTables.ts - Fixed version with return values
import { useState, useCallback } from 'react';
import type { DestinationTable, TableConfig } from '../types';

export const useDestinationTables = () => {
    const [config, setConfig] = useState<TableConfig>({
        maxGuarantors: 3,
        maxJointBorrowers: 3,
        maxAssets: 3,
        maxJobs: 1
    });

    // Generate columns dynamically
    const generateTable = useCallback((config: TableConfig): DestinationTable => {
        const baseColumns = [
            'fiscal_code', 'surname', 'name', 'gender', 'dob', 'pob', 'note_1', 'note_2',
            'country', 'postcode', 'region', 'province', 'city', 'address', 'vat_number',
            'ndg', 'gbv', 'dbt_date', 'originator', 'credit_type',
            'phone_number', 'email', 'bank_abi', 'bank_cab', 'bank_account',
            'is_verified'
        ];

        const guarantorFields = [
            'fiscal_code', 'surname', 'name', 'gender', 'dob', 'pob', 'note_1', 'note_2',
            'country', 'postcode', 'region', 'province', 'city', 'address', 'vat_number',
            'ndg', 'phone_number', 'email', 'type', 'limit'
        ];

        const jointFields = [
            'fiscal_code', 'surname', 'name', 'gender', 'dob', 'pob', 'note_1', 'note_2',
            'country', 'postcode', 'region', 'province', 'city', 'address', 'vat_number',
            'ndg', 'phone_number', 'email'
        ];

        const assetFields = [
            'asset_id', 'type', 'last_evaluation_amount', 'last_evaluation_date',
            'country', 'postcode', 'region', 'province', 'city', 'address',
            'sheet', 'particle', 'sub', 'category', 'square_meter', 'vain'
        ];

        const jobFields = [
            'reference', 'pension_category', 'employer_name', 'start_date', 'note_date', 'income_range', 'monthly_income', 'work_activity_notes',
            'legal_street_type', 'legal_street', 'legal_street_number', 'legal_at', 'legal_city', 'legal_postcode', 'legal_province', 'employer_vat_number', 'employer_tax_code',
            'operation_street_type', 'operation_street', 'operation_street_number', 'operation_at', 'operation_postcode', 'operation_province',
            'employer_phone', 'employer_fax'
        ];

        const financeFields = [
            'ongoing_garnishments', 'garnishment_amount', 'garnishment_due_date', 'garnishment_notes', 'ongoing_assignments', 'assignment_amount', 'assignment_due_date',
            'assignment_notes', 'fixed_term_contract_expiry_date', 'contract_type', 'legal_at', 'legal_city', 'legal_postcode', 'legal_province', 'employer_vat_number', 'employer_tax_code',
        ];

        const columns = [...baseColumns, ...financeFields];

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

        // Generate job columns
        for (let i = 1; i <= config.maxJobs; i++) {
            jobFields.forEach(field => {
                columns.push(`job_${i}_${field}`);
            });
        }

        // Generate finance columns
        financeFields.forEach(field => {
            columns.push(`finance_${field}`);
        });

        return {
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
            const newSlotNumber = config.maxGuarantors + 1;
            updateConfig({ maxGuarantors: newSlotNumber });
            return newSlotNumber;
        }
        return null;
    }, [config.maxGuarantors, updateConfig]);

    const removeGuarantorSlot = useCallback(() => {
        if (config.maxGuarantors > 0) {
            updateConfig({ maxGuarantors: config.maxGuarantors - 1 });
        }
    }, [config.maxGuarantors, updateConfig]);

    const addJointSlot = useCallback(() => {
        if (config.maxJointBorrowers < 5) {
            const newSlotNumber = config.maxJointBorrowers + 1;
            updateConfig({ maxJointBorrowers: newSlotNumber });
            return newSlotNumber;
        }
        return null;
    }, [config.maxJointBorrowers, updateConfig]);

    const removeJointSlot = useCallback(() => {
        if (config.maxJointBorrowers > 0) {
            updateConfig({ maxJointBorrowers: config.maxJointBorrowers - 1 });
        }
    }, [config.maxJointBorrowers, updateConfig]);

    const addAssetSlot = useCallback(() => {
        if (config.maxAssets < 20) {
            const newSlotNumber = config.maxAssets + 1;
            updateConfig({ maxAssets: newSlotNumber });
            return newSlotNumber;
        }
        return null;
    }, [config.maxAssets, updateConfig]);

    const removeAssetSlot = useCallback(() => {
        if (config.maxAssets > 0) {
            updateConfig({ maxAssets: config.maxAssets - 1 });
        }
    }, [config.maxAssets, updateConfig]);

    const addJobSlot = useCallback(() => {
        if (config.maxJobs < 20) {
            const newSlotNumber = config.maxJobs + 1;
            updateConfig({ maxJobs: newSlotNumber });
            return newSlotNumber;
        }
        return null;
    }, [config.maxJobs, updateConfig]);

    const removeJobSlot = useCallback(() => {
        if (config.maxJobs > 0) {
            updateConfig({ maxJobs: config.maxJobs - 1 });
        }
    }, [config.maxJobs, updateConfig]);

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
        removeAssetSlot,
        addJobSlot,
        removeJobSlot
    };
};