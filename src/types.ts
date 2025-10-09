// types.ts - Updated to match backend response format exactly

import React from "react";

// Core data structures (matching frontend expectations)
export interface FileData {
    file: string;  // filename
    sheets: SheetData[];
}

export interface SheetData {
    sheet_name: string;
    have_header: boolean;
    columns: string[];
    sample_data: string[];
}

// Mapping related types (unchanged)
export interface SourceColumn {
    file: string;
    sheet: string;
    value: string; // column name
}

export interface DestinationColumn {
    table: string;
    column: string;
}

export interface ColumnMapping {
    id: number;
    source: SourceColumn;
    destination: DestinationColumn;
}

export interface MappingSource {
    file: string;
    sheet: string;
    column: string;
}

export interface ExportFormat {
    id: string;
    name: string;
    created_at: string;
    updated_at?: string;
    mappings: {[key: string]: MappingSource | Array<{[key: string]: MappingSource}>};
}

// Destination table types (unchanged)
export interface DestinationTable {
    name: string;
    columns: string[];
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
    maxJobs: number;
}

// Export/Import types (unchanged)
export interface MappingData {
    name: string;
    mappings: ColumnMapping[];
    destination_tables: DestinationTable[];
}

export interface MappingExportData {
    name: string;
    mappings: {
        [key: string]: MappingSource | Array<{[key: string]: MappingSource}>;
    };
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

// Backend API types - UPDATED to match actual backend response
export interface BackendScanResponse {
    success: boolean;
    message: string;
    scan_result: ScanResult;
    saved_record?: {
        id: string;
        saved_at: string;
    };
    processing_info: {
        file_size: string;
        max_scan_rows: number;
        saved_to_db: boolean;
    };
}

export interface ScanResult {
    filename: string;
    sheets: SheetInfo[];
    total_sheets: number;
    sheets_with_header: number;
    file_size: string;
}

// UPDATED: This now matches the actual backend response structure
export interface MultipleScanResponse {
    success: boolean;
    message: string;
    summary: {
        total_files: number;
        successful_files: number;
        failed_files: number;
        total_size: string;
        total_sheets: number;
        total_sheets_with_header: number;
        max_scan_rows: number;
        saved_to_db: boolean;
    };
    scan_results: Array<{
        filename: string;
        success: boolean;
        file_index: number;
        file_size?: string;
        scan_result?: FileData; // This is the transformed format for frontend
        saved_record?: {
            id: string;
            saved_at: string;
        };
        sheets_count?: number;
        sheets_with_header?: number;
        error?: string;
    }>;
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

export interface SheetInfo {
    sheet_name: string;
    have_header: boolean;
    columns: string[];
    sample_data: string[];
    rows_scanned?: number;
    total_rows?: number;
}

// Error handling
export interface ApiError {
    detail: string | unknown[];
}

// Stats
export interface Stats {
    total_mappings: number;
    timestamp: string;
}

export interface ExcelUploadProps {
    onSchemaLoaded: (schema: FileData[]) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export interface UploadedFile {
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
    schema?: FileData; // This will contain the transformed data
}