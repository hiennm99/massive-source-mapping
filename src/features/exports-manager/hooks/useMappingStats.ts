import { useMemo } from "react";
import type { MappingExport } from "@types";
import { getArrayMappingKeys } from "@utils";

/**
 * Custom Hook to calculate mapping statistics
 */
export const useMappingStats = (mappings: MappingExport['mappings']) => {
    return useMemo(() => {
        let count = 0;
        const files = new Set<string>();
        const sheets = new Set<string>();

        const processSources = (sources: any) => {
            if (!sources) return;
            Object.values(sources).forEach((source: any) => {
                if (source?.file) files.add(source.file);
                if (source?.sheet) sheets.add(source.sheet);
            });
        };

        if (mappings.base) {
            count += Object.keys(mappings.base).length;
            processSources(mappings.base);
        }

        getArrayMappingKeys().forEach((key: string) => {
            const value = mappings[key];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    count += Object.keys(item).length;
                    processSources(item);
                });
            }
        });

        return { totalMappings: count, uniqueFiles: files, uniqueSheets: sheets };
    }, [mappings]);
};
