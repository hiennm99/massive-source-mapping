// src/services/excelUploadService.ts - Updated to match current backend
import { apiClient, handleApiError, showSuccessToast } from '@lib';
import type {SheetInfo, FileData, BackendScanResponse, ScanResult} from "@types";

// API endpoints
const API_ENDPOINTS = {
    singleUpload: '/api/excel/scan-upload-gcs',
    multipleUpload: '/api/excel/scan-upload-multiple'
};

// Updated interface to match actual backend response
interface ActualMultipleResponse {
    success: boolean;
    message: string;
    scan_results: Array<{
        filename: string;
        success: boolean;
        result?: {
            success: boolean;
            message: string;
            scan_result: {
                filename: string;
                file_size: number;
                scan_timestamp: string;
                sheets: Array<{
                    sheet_name: string;
                    have_header: boolean;
                    header_row_idx: number;
                    header_at_row: number;
                    columns: string[];
                    sample_data: string[];
                    header_quality: never;
                    processed_file_info: never;
                }>;
                total_sheets: number;
                sheets_with_header: number;
                gcs_storage: never;
            };
            saved_record?: never;
            processing_info: never;
        };
        error?: string;
    }>;
    saved_record: never;
    processing_info: {
        total_files: number;
        successful_files: number;
        failed_files: number;
        total_size: string;
        max_scan_rows: number;
        saved_to_db: boolean;
        saved_to_gcs: boolean;
    };
}

// Single file upload and scan
export const uploadAndScanExcelFile = async (
    file: File,
    maxScanRows: number = 10,
    saveToDb: boolean = true
): Promise<FileData> => {
    try {
        // Validate file
        if (!file) {
            throw new Error('No file provided');
        }

        if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
            throw new Error('Only Excel files (.xlsx, .xls) are supported');
        }

        // Check file size (100MB limit)
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 100) {
            throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB. Maximum allowed: 100MB`);
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('max_scan_rows', maxScanRows.toString());
        formData.append('save_to_db', saveToDb.toString());

        console.log(`Uploading file: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);

        // Make API call
        const response = await apiClient.post<BackendScanResponse>(API_ENDPOINTS.multipleUpload, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        const result = response.data;

        if (!result.success) {
            throw new Error(result.message || 'Scan failed');
        }

        console.log('Upload successful:', result);

        // Transform to frontend format
        const fileData: FileData = {
            file: file.name,
            sheets: result.scan_result.sheets.map(sheet => ({
                sheet_name: sheet.sheet_name,
                have_header: sheet.have_header,
                columns: sheet.columns || [],
                sample_data: sheet.sample_data || []
            }))
        };

        showSuccessToast(`Successfully scanned ${file.name} - Found ${result.scan_result.total_sheets} sheets`);

        return fileData;

    } catch (error) {
        console.error('Excel upload error:', error);
        handleApiError(error, 'Failed to upload Excel file');
        throw error;
    }
};

// Multiple files upload and scan - UPDATED TO MATCH BACKEND
export const uploadAndScanMultipleExcelFiles = async (
    files: File[],
    maxScanRows: number = 10,
    saveToDb: boolean = true
): Promise<FileData[]> => {
    try {
        // Validate files array
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        if (files.length > 5) {
            throw new Error(`Too many files: ${files.length}. Maximum allowed: 5 files`);
        }

        // Validate each file
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
                throw new Error(`File ${i + 1} (${file.name}): Only Excel files (.xlsx, .xls) are supported`);
            }

            const fileSizeMB = file.size / (1024 * 1024);
            totalSize += fileSizeMB;

            if (fileSizeMB > 100) {
                throw new Error(`File ${i + 1} too large: ${fileSizeMB.toFixed(2)}MB. Maximum allowed: 100MB`);
            }
        }

        if (totalSize > 200) {
            throw new Error(`Total upload size too large: ${totalSize.toFixed(2)}MB. Maximum allowed: 200MB`);
        }

        // Prepare form data
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('max_scan_rows', maxScanRows.toString());
        formData.append('save_to_db', saveToDb.toString());

        console.log(`Uploading ${files.length} files, total size: ${totalSize.toFixed(2)}MB`);

        // Make API call
        const response = await apiClient.post<ActualMultipleResponse>(API_ENDPOINTS.multipleUpload, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        const result = response.data;

        if (!result.success) {
            throw new Error(result.message || 'Batch scan failed');
        }

        console.log('Batch upload successful:', result);

        // Transform successful results to frontend format - MATCH ACTUAL BACKEND STRUCTURE
        const successfulResults: FileData[] = [];
        const errors: string[] = [];

        result.scan_results.forEach(fileResult => {
            if (fileResult.success && fileResult.result && fileResult.result.scan_result) {
                // Extract data from the nested structure
                const scanResult = fileResult.result.scan_result;

                successfulResults.push({
                    file: fileResult.filename, // Use filename from fileResult level
                    sheets: scanResult.sheets.map(sheet => ({
                        sheet_name: sheet.sheet_name,
                        have_header: sheet.have_header,
                        columns: sheet.columns || [],
                        sample_data: sheet.sample_data || []
                    }))
                });
            } else if (fileResult.error) {
                errors.push(`${fileResult.filename}: ${fileResult.error}`);
            }
        });

        // Show results
        if (successfulResults.length > 0) {
            const totalSheets = successfulResults.reduce((sum, file) => sum + file.sheets.length, 0);
            showSuccessToast(
                `Successfully processed ${successfulResults.length}/${files.length} files. ` +
                `Found ${totalSheets} total sheets.`
            );
        }

        if (errors.length > 0) {
            console.warn('Some files failed to process:', errors);
            showSuccessToast(`${errors.length} file(s) failed to process. Check console for details.`);
        }

        if (successfulResults.length === 0) {
            throw new Error('No files were successfully processed');
        }

        return successfulResults;

    } catch (error) {
        console.error('Multiple Excel upload error:', error);
        handleApiError(error, 'Failed to upload Excel files');
        throw error;
    }
};

// Utility function to validate Excel file
export const validateExcelFile = (file: File): { valid: boolean; error?: string } => {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        return { valid: false, error: 'Only Excel files (.xlsx, .xls) are supported' };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 100) {
        return { valid: false, error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum allowed: 100MB` };
    }

    return { valid: true };
};

// Utility function to validate multiple Excel files
export const validateExcelFiles = (files: File[]): { valid: boolean; error?: string } => {
    if (!files || files.length === 0) {
        return { valid: false, error: 'No files provided' };
    }

    if (files.length > 5) {
        return { valid: false, error: `Too many files: ${files.length}. Maximum allowed: 5 files` };
    }

    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
        const fileValidation = validateExcelFile(files[i]);
        if (!fileValidation.valid) {
            return { valid: false, error: `File ${i + 1}: ${fileValidation.error}` };
        }

        totalSize += files[i].size / (1024 * 1024);
    }

    if (totalSize > 200) {
        return { valid: false, error: `Total size too large: ${totalSize.toFixed(2)}MB. Maximum allowed: 200MB` };
    }

    return { valid: true };
};

// Export types for use in other files
export type {
    FileData,
    SheetInfo,
    ScanResult,
    BackendScanResponse
};