// src/config/columnGroups.ts - Centralized column group configuration

export interface ColumnGroupDefinition {
    key: string;
    name: string;
    iconName: string; // Changed from icon to iconName
    color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'red' | 'yellow' | 'pink' | 'teal';
    maxInstances: number;
    fields: string[];
    prefix: string;
    isMultiInstance: boolean;
}

export const COLUMN_GROUPS: ColumnGroupDefinition[] = [
    {
        key: 'addresses',
        name: 'Address',
        iconName: 'MapPin', // Changed from Address to MapPin (more appropriate for addresses)
        color: 'orange',
        maxInstances: 10,
        prefix: 'address',
        isMultiInstance: true,
        fields: [
            'country', 'province', 'city', 'street',
            'note'
        ]
    },
    {
        key: 'contacts',
        name: 'Contact',
        iconName: 'Phone', // Changed from Home to Phone (more appropriate for contact info)
        color: 'orange',
        maxInstances: 10,
        prefix: 'contact',
        isMultiInstance: true,
        fields: [
            'phone_number', 'email', 'is_pec', 'is_verified',
            'note'
        ]
    },
    {
        key: 'banks',
        name: 'Bank',
        iconName: 'Building2', // Changed from Home to Building2 (more appropriate for banks)
        color: 'orange',
        maxInstances: 10,
        prefix: 'bank',
        isMultiInstance: true,
        fields: [
            'fiscal_code',
            'country', 'province', 'city', 'street',
            'bank_name', 'bank_abi', 'bank_cab', 'account_number', 'account_type',
            'note'
        ]
    },
    {
        key: 'guarantors',
        name: 'Guarantor',
        iconName: 'Shield',
        color: 'green',
        maxInstances: 10,
        prefix: 'guarantor',
        isMultiInstance: true,
        fields: [
            'fiscal_code', 'surname', 'name', 'ndg',
            'type', 'limit',
            'note'
        ]
    },
    {
        key: 'joints',
        name: 'Joints',
        iconName: 'Users',
        color: 'purple',
        maxInstances: 10,
        prefix: 'joint',
        isMultiInstance: true,
        fields: [
            'fiscal_code', 'surname', 'name', 'ndg',
            'note'
        ]
    },
    {
        key: 'assets',
        name: 'Asset',
        iconName: 'Home', // Keep Home for assets as it represents property/real estate
        color: 'orange',
        maxInstances: 10,
        prefix: 'asset',
        isMultiInstance: true,
        fields: [
            'asset_id', 'type', 'last_evaluation_amount', 'last_evaluation_date',
            'country', 'province', 'city', 'street',
            'sheet', 'particle', 'sub', 'category', 'square_meter', 'vain',
            'note'
        ]
    },
    {
        key: 'jobs',
        name: 'Job',
        iconName: 'Briefcase',
        color: 'indigo',
        maxInstances: 5,
        prefix: 'job',
        isMultiInstance: true,
        fields: [
            'reference', 'pension_category', 'employer_name', 'start_date', 'end_date',
            'income_range', 'monthly_income', 'work_activity_notes', 'employer_vat_number', 'employer_tax_code', 'employer_phone', 'employer_fax',
            'legal_street_type', 'legal_street', 'legal_street_number', 'legal_at', 'legal_city', 'legal_province',
            'operation_street_type', 'operation_street', 'operation_street_number', 'operation_at', 'operation_city', 'operation_province',
            'note'
        ]
    },
    {
        key: 'finance',
        name: 'Finance',
        iconName: 'DollarSign',
        color: 'red',
        maxInstances: 2,
        prefix: 'finance',
        isMultiInstance: false, // Changed to false - single instance group
        fields: [
            'supplier_evaluation', 'bank_account',
            'ongoing_garnishments', 'garnishment_amount', 'garnishment_expiration_date', 'garnishment_notes',
            'ongoing_assignments', 'assignment_amount', 'assignment_expiration_date', 'assignment_notes',
            'fixed_term_contract_expiry_date', 'contract_type',
            'note'
        ]
    }
];

// Base columns that don't belong to any group - ADDED created_date
export const BASE_COLUMNS = [
    'fiscal_code', 'surname', 'name', 'vat_number',
    'ndg', 'gbv', 'dbt_data', 'originator', 'credit_type', 'is_verified', 'created_date',
    'note'
];

// Add the missing ALL_BASE_COLUMNS export
export const ALL_BASE_COLUMNS = BASE_COLUMNS;

// Utility functions
export const getGroupByKey = (key: string): ColumnGroupDefinition | undefined => {
    return COLUMN_GROUPS.find(group => group.key === key);
};

export const getGroupByPrefix = (prefix: string): ColumnGroupDefinition | undefined => {
    return COLUMN_GROUPS.find(group => group.prefix === prefix);
};

export const parseColumnName = (columnName: string): { groupKey?: string; instanceNumber?: number; field?: string; prefix?: string } | null => {
    // Try to match multi-instance pattern: prefix_number_field
    for (const group of COLUMN_GROUPS) {
        if (group.isMultiInstance) {
            const regex = new RegExp(`^${group.prefix}_(\\d+)_(.+)$`);
            const match = columnName.match(regex);
            if (match) {
                return {
                    groupKey: group.key,
                    prefix: group.prefix,
                    instanceNumber: parseInt(match[1]),
                    field: match[2]
                };
            }
        } else {
            // Single instance pattern: prefix_field
            const regex = new RegExp(`^${group.prefix}_(.+)$`);
            const match = columnName.match(regex);
            if (match) {
                return {
                    groupKey: group.key,
                    prefix: group.prefix,
                    field: match[1]
                };
            }
        }
    }
    return null;
};