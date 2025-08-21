// types.ts - All type definitions
import React from "react";

export interface SourceColumn {
    path: string;
    value: string;
    type: 'column' | 'value' | 'property';
    file?: string;
    sheet?: string;
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
    id: string;
    name: string;
    columns: string[];
}

export interface ColumnMapping {
    id: number;
    source: SourceColumn;
    destination: {
        table: string;
        column: string;
    };
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