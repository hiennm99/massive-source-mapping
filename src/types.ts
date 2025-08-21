// types.ts - All type definitions
import React from "react";

export interface SourceColumn {
    file: string;
    sheet: string;
    value: string; // column name
}

export interface DestinationColumn {
    table: string;
    column: string;
}

export interface SheetData {
    sheet_name: string;
    have_header: boolean;
    columns: string[];
    sample_data: string[];
}

export interface FileData {
    file: string;
    sheets: SheetData[];
}

export interface DestinationTable {
    name: string;
    columns: string[];
}

export interface ColumnMapping {
    id: number;
    source: SourceColumn;
    destination: DestinationColumn;
}

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

export interface TableConfig {
    maxGuarantors: number;
    maxJointBorrowers: number;
    maxAssets: number;
}

export interface MappingData {
    name: string;
    mappings: ColumnMapping[];
    destination_tables: DestinationTable[];
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

export interface MappingExport {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    mappings: {
        [key: string]: MappingSource | Array<{[key: string]: MappingSource}>;
    };
}

export interface Stats {
    total_mappings: number;
    timestamp: string;
}

export interface MappingSource {
    file: string;
    sheet: string;
    column: string;
}

export interface MappingExportData {
    name: string;
    mappings: {
        [key: string]: MappingSource | Array<{[key: string]: MappingSource}>;
    };
}

export interface ApiError {
    detail: string | unknown[];
}

export interface ExportFormat {
    id: string;
    name: string;
    created_at: string;
    mappings: {
        [key: string]: MappingSource | Array<{[key: string]: MappingSource}>;
    };
}
