import type {MappingSource} from "../services/mappingExportService.ts";

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

// export interface DestinationTablesPanelProps {
//     mappings: ColumnMapping[];
//     onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
//     onDrop: (e: React.DragEvent<HTMLDivElement>, destinationTable: DestinationTable, destinationColumn: string) => void;
//     onRemoveMapping: (mappingId: number) => void;
// }

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