// src/utils/columnGroupManager.ts - Utility for managing column groups
import { COLUMN_GROUPS, getGroupByKey } from '../config/columnGroups';
import type { ColumnGroupDefinition } from '../config/columnGroups';

export class ColumnGroupManager {
    /**
     * Add a new column group to the configuration
     * This is a helper function for development - in production,
     * you would add directly to the COLUMN_GROUPS array
     */
    static addNewGroup(groupDefinition: ColumnGroupDefinition): void {
        // In a real implementation, this might update a database or config file
        console.log('Adding new group:', groupDefinition);

        // For development, you can use this to validate your group definition
        this.validateGroup(groupDefinition);
    }

    /**
     * Validate a group definition
     */
    static validateGroup(group: ColumnGroupDefinition): boolean {
        const errors: string[] = [];

        if (!group.key || typeof group.key !== 'string') {
            errors.push('Group key is required and must be a string');
        }

        if (!group.name || typeof group.name !== 'string') {
            errors.push('Group name is required and must be a string');
        }

        if (!group.prefix || typeof group.prefix !== 'string') {
            errors.push('Group prefix is required and must be a string');
        }

        if (!Array.isArray(group.fields) || group.fields.length === 0) {
            errors.push('Group must have at least one field');
        }

        if (typeof group.maxInstances !== 'number' || group.maxInstances < 1) {
            errors.push('maxInstances must be a positive number');
        }

        if (typeof group.isMultiInstance !== 'boolean') {
            errors.push('isMultiInstance must be a boolean');
        }

        // Check for duplicate keys/prefixes
        const existingGroup = COLUMN_GROUPS.find(g =>
            g.key === group.key || g.prefix === group.prefix
        );
        if (existingGroup) {
            errors.push(`Group with key "${group.key}" or prefix "${group.prefix}" already exists`);
        }

        if (errors.length > 0) {
            console.error('Group validation errors:', errors);
            return false;
        }

        console.log('✅ Group validation passed');
        return true;
    }

    /**
     * Generate example column names for a group
     */
    static generateExampleColumns(groupKey: string, instanceCount: number = 1): string[] {
        const group = getGroupByKey(groupKey);
        if (!group) return [];

        const columns: string[] = [];

        if (group.isMultiInstance) {
            for (let i = 1; i <= instanceCount; i++) {
                group.fields.forEach(field => {
                    columns.push(`${group.prefix}_${i}_${field}`);
                });
            }
        } else {
            group.fields.forEach(field => {
                columns.push(`${group.prefix}_${field}`);
            });
        }

        return columns;
    }

    /**
     * Get all available colors that aren't being used
     */
    static getAvailableColors(): string[] {
        const allColors = ['blue', 'green', 'purple', 'orange', 'indigo', 'red', 'yellow', 'pink', 'teal'];
        const usedColors = COLUMN_GROUPS.map(g => g.color);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return allColors.filter(color => !usedColors.includes(color));
    }

    /**
     * Helper to create a new group definition template
     */
    static createGroupTemplate(
        key: string,
        name: string,
        fields: string[],
        options: {
            isMultiInstance?: boolean;
            maxInstances?: number;
            color?: string;
            iconName?: string;
        } = {}
    ): ColumnGroupDefinition {
        const {
            isMultiInstance = true,
            maxInstances = 10,
            color = this.getAvailableColors()[0] || 'blue',
            iconName = 'Briefcase'
        } = options;

        return {
            key,
            name,
            iconName,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            color: color,
            maxInstances,
            fields,
            prefix: key.replace(/s$/, ''), // Remove 's' from plural keys
            isMultiInstance
        };
    }

    /**
     * Pretty print all groups for debugging
     */
    static printAllGroups(): void {
        console.table(
            COLUMN_GROUPS.map(group => ({
                Key: group.key,
                Name: group.name,
                Prefix: group.prefix,
                'Multi Instance': group.isMultiInstance,
                'Max Instances': group.maxInstances,
                'Field Count': group.fields.length,
                Color: group.color
            }))
        );
    }
}

// Example usage:
export const exampleUsage = () => {
    // 1. Validate existing groups
    COLUMN_GROUPS.forEach(group => {
        console.log(`Validating ${group.key}:`, ColumnGroupManager.validateGroup(group));
    });

    // 2. Create a new group template
    const newGroup = ColumnGroupManager.createGroupTemplate(
        'insurance_policies',
        'Insurance Policy',
        ['policy_number', 'provider', 'coverage_amount', 'premium', 'start_date', 'end_date'],
        {
            isMultiInstance: true,
            maxInstances: 5,
            color: 'yellow',
            iconName: 'Shield'
        }
    );

    console.log('New group template:', newGroup);

    // 3. Generate example columns
    const exampleColumns = ColumnGroupManager.generateExampleColumns('vehicles', 2);
    console.log('Example vehicle columns:', exampleColumns);

    // 4. Check available colors
    console.log('Available colors:', ColumnGroupManager.getAvailableColors());

    // 5. Print all groups
    ColumnGroupManager.printAllGroups();
};