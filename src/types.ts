// types.ts - All type definitions
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

export interface MappingData {
    name: string;
    mappings: ColumnMapping[];
    destination_tables: DestinationTable[];
}