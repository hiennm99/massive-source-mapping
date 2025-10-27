import type { MappingSource } from "../types";

export interface ColumnGroup {
    name: string;
    prefix: string;
    columns: string[];
    icon: React.ReactNode;
    color: string;
    instanceNumber?: number;
}

export interface TabGroup {
    key: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    groups: ColumnGroup[];
}

// Existing types from your app
export interface ColumnMapping {
    id: number;
    source: {
        file: string;
        sheet: string;
        value: string;
    };
    destination: {
        table: string;
        column: string;
    };
}

export interface DestinationTable {
    name: string;
    columns: string[];
}

export interface MappingExportResponse {
    id: string;
    name: string;
    mappings: {
        [key: string]: MappingSource | Array<{[key: string]: MappingSource}>;
    };
    created_at: string;
    updated_at: string;
}