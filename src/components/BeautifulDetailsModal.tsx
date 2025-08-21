import {
    X,
    Calendar,
    Database,
    MapPin,
    Table,
    Clock,
    Hash,
    FolderTree,
    Target,
    FileText,
    Grid,
    Layers,
    Users,
    Link,
    Building,
} from "lucide-react";

/** ===== Types for new backend structure ===== */
interface MappingSource {
    file: string;
    sheet: string;
    column: string;
}
interface MappingExport {
    id: string;
    name: string;
    created_at: string | Date | number;
    updated_at: string | Date | number;
    mappings: {
        [key: string]: MappingSource | Array<{[key: string]: MappingSource}>;
    };
}

interface BeautifulDetailsModalProps {
    selectedExport: MappingExport | null | undefined;
    showDetails: boolean;
    setShowDetails: (v: boolean) => void;
    formatDate: (d: string) => string;
}

/** Helpers */
const toStr = (v: unknown): string => (v == null ? "" : String(v));

/** Short form like "abc12345..." (or "N/A" if empty) */
const shortId = (id: unknown, take = 8): string => {
    const s = toStr(id);
    if (!s) return "N/A";
    return s.length > take ? `${s.slice(0, take)}...` : s;
};

/** Normalize various date inputs to a string your formatter can accept. */
const normalizeDateInput = (v: string | number | Date): string => {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "number") return new Date(v).toISOString();
    if (typeof v === "string") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toISOString();
    }
    return toStr(v);
};

function BeautifulDetailsModal({
                                   selectedExport,
                                   showDetails,
                                   setShowDetails,
                                   formatDate,
                               }: BeautifulDetailsModalProps) {
    if (!showDetails || !selectedExport) return null;

    // Helper to count mappings
    const countMappings = (mappings: MappingExport['mappings']): number => {
        let count = 0;
        Object.entries(mappings).forEach(([key, value]) => {
            if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        count += Object.keys(item).length;
                    });
                }
            } else {
                count += 1;
            }
        });
        return count;
    };

    // Helper to get unique files
    const getUniqueFiles = (mappings: MappingExport['mappings']): Set<string> => {
        const files = new Set<string>();
        Object.entries(mappings).forEach(([key, value]) => {
            if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        Object.values(item).forEach(source => {
                            if (source && typeof source === 'object' && 'file' in source) {
                                files.add(source.file);
                            }
                        });
                    });
                }
            } else {
                if (value && typeof value === 'object' && 'file' in value) {
                    files.add(value.file);
                }
            }
        });
        return files;
    };

    // Helper to get unique sheets
    const getUniqueSheets = (mappings: MappingExport['mappings']): Set<string> => {
        const sheets = new Set<string>();
        Object.entries(mappings).forEach(([key, value]) => {
            if (key === 'guarantors' || key === 'joints' || key === 'assets') {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        Object.values(item).forEach(source => {
                            if (source && typeof source === 'object' && 'sheet' in source) {
                                sheets.add(source.sheet);
                            }
                        });
                    });
                }
            } else {
                if (value && typeof value === 'object' && 'sheet' in value) {
                    sheets.add(value.sheet);
                }
            }
        });
        return sheets;
    };

    // Helper to render mapping source
    const renderMappingSource = (source: MappingSource, label: string, icon: React.ReactNode) => (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900 flex items-center">
                    {icon}
                    {label}
                </h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                    <div className="flex items-center">
                        <FileText className="w-4 h-4 text-blue-600 mr-1" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">File</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <code className="text-xs text-blue-800 break-all font-medium">
                            {source.file}
                        </code>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <Grid className="w-4 h-4 text-indigo-600 mr-1" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">Sheet</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-200">
                        <code className="text-xs text-indigo-800 break-all font-medium">
                            {source.sheet}
                        </code>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <Layers className="w-4 h-4 text-purple-600 mr-1" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">Column</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <code className="text-xs text-purple-800 break-all font-medium">
                            {source.column}
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );

    // Helper to render array mappings (guarantors, joints, assets)
    const renderArrayMappings = (items: Array<{[key: string]: MappingSource}>, title: string, icon: React.ReactNode, color: string) => {
        if (items.length === 0) return null;

        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold text-gray-900 flex items-center`}>
                        {icon}
                        {title}
                        <span className={`ml-2 px-3 py-1 bg-${color}-100 text-${color}-800 rounded-full text-sm font-medium`}>
                            {items.length} items
                        </span>
                    </h3>
                </div>
                <div className="space-y-6">
                    {items.map((item, itemIndex) => (
                        <div
                            key={itemIndex}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                        >
                            <div className={`bg-gradient-to-r from-${color}-500 to-${color}-600 p-4`}>
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                            {icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold">
                                                {title.slice(0, -1)} #{itemIndex + 1}
                                            </h4>
                                            <p className={`text-${color}-100 text-sm`}>
                                                {Object.keys(item).length} field{Object.keys(item).length > 1 ? 's' : ''} mapped
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {Object.entries(item).map(([fieldKey, fieldSource]) => (
                                    renderMappingSource(
                                        fieldSource,
                                        fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                        <div className={`w-6 h-6 bg-${color}-100 rounded-lg flex items-center justify-center mr-2`}>
                                            <span className={`text-xs font-bold text-${color}-600`}>
                                                {fieldKey.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const totalMappings = countMappings(selectedExport.mappings);
    const uniqueFiles = getUniqueFiles(selectedExport.mappings);
    const uniqueSheets = getUniqueSheets(selectedExport.mappings);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Export Details</h2>
                                <p className="text-blue-100 font-medium">
                                    {selectedExport.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDetails(false)}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] bg-gradient-to-br from-gray-50 to-white">
                    {/* Export Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-3">
                                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                                <h3 className="font-semibold text-gray-900">Created Date</h3>
                            </div>
                            <p className="text-gray-600 text-lg font-medium">
                                {formatDate(normalizeDateInput(selectedExport.created_at))}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-3">
                                <Clock className="w-5 h-5 text-green-600 mr-2" />
                                <h3 className="font-semibold text-gray-900">Last Updated</h3>
                            </div>
                            <p className="text-gray-600 text-lg font-medium">
                                {formatDate(normalizeDateInput(selectedExport.updated_at))}
                            </p>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 border border-blue-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Hash className="w-5 h-5 text-blue-600 mr-2" />
                            Overview Statistics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <MapPin className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{totalMappings}</p>
                                <p className="text-sm text-gray-600">Total Mappings</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{uniqueFiles.size}</p>
                                <p className="text-sm text-gray-600">Unique Files</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <Grid className="w-6 h-6 text-purple-600" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{uniqueSheets.size}</p>
                                <p className="text-sm text-gray-600">Unique Sheets</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <FolderTree className="w-6 h-6 text-orange-600" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{shortId(selectedExport.id)}</p>
                                <p className="text-sm text-gray-600">Export ID</p>
                            </div>
                        </div>
                    </div>

                    {/* Regular Mappings */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Target className="w-6 h-6 text-blue-600 mr-2" />
                                Regular Field Mappings
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {Object.entries(selectedExport.mappings)
                                .filter(([key]) => !['guarantors', 'joints', 'assets'].includes(key))
                                .map(([key, value]) => {
                                    if (value && typeof value === 'object' && 'file' in value) {
                                        return renderMappingSource(
                                            value as MappingSource,
                                            key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                                <span className="text-xs font-bold text-blue-600">
                                                    {key.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })
                            }
                        </div>
                    </div>

                    {/* Guarantors */}
                    {selectedExport.mappings.guarantors && Array.isArray(selectedExport.mappings.guarantors) &&
                        renderArrayMappings(
                            selectedExport.mappings.guarantors,
                            "Guarantors",
                            <Users className="w-5 h-5 text-white" />,
                            "green"
                        )
                    }

                    {/* Joints */}
                    {selectedExport.mappings.joints && Array.isArray(selectedExport.mappings.joints) &&
                        renderArrayMappings(
                            selectedExport.mappings.joints,
                            "Joint Borrowers",
                            <Link className="w-5 h-5 text-white" />,
                            "purple"
                        )
                    }

                    {/* Assets */}
                    {selectedExport.mappings.assets && Array.isArray(selectedExport.mappings.assets) &&
                        renderArrayMappings(
                            selectedExport.mappings.assets,
                            "Assets",
                            <Building className="w-5 h-5 text-white" />,
                            "orange"
                        )
                    }

                    {/* Files and Sheets Summary */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Table className="w-6 h-6 text-green-600 mr-2" />
                                Source Files & Sheets
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Files */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-white text-lg">Source Files ({uniqueFiles.size})</h4>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-2">
                                        {Array.from(uniqueFiles).map((file) => (
                                            <div key={file} className="flex items-center p-2 bg-gray-50 rounded-lg">
                                                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                                                <span className="text-sm font-medium text-gray-700 truncate">{file}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sheets */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                                            <Grid className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-white text-lg">Sheets Used ({uniqueSheets.size})</h4>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(uniqueSheets).map((sheet) => (
                                            <span
                                                key={sheet}
                                                className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-xs font-medium hover:from-green-100 hover:to-green-200 hover:text-green-800 transition-colors"
                                            >
                                                {sheet}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Export ID:{" "}
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                                {toStr(selectedExport.id) || "N/A"}
                            </code>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BeautifulDetailsModal;