import {
    X,
    Calendar,
    Database,
    MapPin,
    Table,
    Download,
    Clock,
    Hash,
    FolderTree,
    Target,
    FileText,
    Grid,
    Layers,
} from "lucide-react";

/** ===== Types your UI needs (non-breaking, minimal) ===== */
type Mapping = {
    id?: string; // keep string to match MappingExport
    source?: { path?: string };
    destination?: { table?: string; column?: string };
};

type DestinationGroup = {
    destination?: Mapping["destination"];
    mappings: Array<Mapping & { originalIndex: number }>;
    count: number;
};

type DestinationTable = {
    id?: string; // keep string to match MappingExport
    name: string;
    columns?: string[];
};

/** Base contract the component relies on */
type BaseExport = {
    id: string;
    name: string;
    created_at: string | Date | number;
    updated_at: string | Date | number;
    mappings?: Mapping[];
    destination_tables?: DestinationTable[];
};

/** Make the component generic so it can accept your MappingExport exactly */
interface BeautifulDetailsModalProps<T extends BaseExport = BaseExport> {
    selectedExport: T | null | undefined;
    showDetails: boolean;
    setShowDetails: (v: boolean) => void;
    downloadExport: (exp: T) => void;
    /** Your formatter expects a string, so we pass it a normalized string */
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

function BeautifulDetailsModal<T extends BaseExport>({
                                                         selectedExport,
                                                         showDetails,
                                                         setShowDetails,
                                                         downloadExport,
                                                         formatDate,
                                                     }: BeautifulDetailsModalProps<T>) {
    if (!showDetails || !selectedExport) return null;

    const parseSourcePath = (
        path?: string
    ): { file: string; sheet: string; column: string } => {
        if (!path) return { file: "N/A", sheet: "N/A", column: "N/A" };
        const parts = path.split(" > ");
        if (parts.length >= 3) {
            return {
                file: parts[0] || "N/A",
                sheet: parts[1] || "N/A",
                column: parts.slice(2).join(" > ") || "N/A",
            };
        }
        return { file: path, sheet: "N/A", column: "N/A" };
    };

    const groupMappingsByDestination = (
        mappings: Mapping[] = []
    ): Record<string, DestinationGroup> => {
        return mappings.reduce<Record<string, DestinationGroup>>(
            (groups, mapping, index) => {
                const table = mapping.destination?.table || "unknown";
                const column = mapping.destination?.column || "unknown";
                const destKey = `${table}.${column}`;

                if (!groups[destKey]) {
                    groups[destKey] = {
                        destination: mapping.destination,
                        mappings: [],
                        count: 0,
                    };
                }

                groups[destKey].mappings.push({ ...mapping, originalIndex: index });
                groups[destKey].count += 1;
                return groups;
            },
            {}
        );
    };

    const groupedMappings = groupMappingsByDestination(
        selectedExport.mappings ?? []
    );

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
                                <p className="text-2xl font-bold text-gray-900">
                                    {selectedExport.mappings?.length ?? 0}
                                </p>
                                <p className="text-sm text-gray-600">Total Mappings</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <Target className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {Object.keys(groupedMappings).length}
                                </p>
                                <p className="text-sm text-gray-600">Unique Destinations</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <Database className="w-6 h-6 text-purple-600" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {toStr(selectedExport.id).slice(0, 8)}
                                </p>
                                <p className="text-sm text-gray-600">Export ID</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <FolderTree className="w-6 h-6 text-orange-600" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">JSON</p>
                                <p className="text-sm text-gray-600">Format</p>
                            </div>
                        </div>
                    </div>

                    {/* Grouped Mappings */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Layers className="w-6 h-6 text-blue-600 mr-2" />
                                Grouped Data Mappings
                                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {Object.keys(groupedMappings).length} destinations
                </span>
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {(
                                Object.entries(
                                    groupedMappings
                                ) as Array<[string, DestinationGroup]>
                            ).map(([destKey, group], groupIndex) => (
                                <div
                                    key={destKey}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                                >
                                    {/* Destination Header */}
                                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4">
                                        <div className="flex items-center justify-between text-white">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                                    <Target className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold flex items-center space-x-2">
                            <span>
                              {group.destination?.table || "Unknown Table"}
                            </span>
                                                        <span className="text-green-100">.</span>
                                                        <span className="text-yellow-200">
                              {group.destination?.column || "Unknown Column"}
                            </span>
                                                    </h4>
                                                    <p className="text-green-100 text-sm">
                                                        {group.count} source
                                                        {group.count > 1 ? "s" : ""} mapped to this
                                                        destination
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                        Group #{groupIndex + 1}
                      </span>
                                        </div>
                                    </div>

                                    {/* Source Mappings */}
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {group.mappings.map((mapping) => {
                                                const sourceParts = parseSourcePath(mapping.source?.path);
                                                return (
                                                    <div
                                                        key={mapping.id ?? mapping.originalIndex}
                                                        className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h5 className="font-medium text-gray-900 flex items-center">
                                                                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                  <span className="text-xs font-bold text-blue-600">
                                    {mapping.originalIndex + 1}
                                  </span>
                                                                </div>
                                                                Source #{mapping.originalIndex + 1}
                                                            </h5>
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                {shortId(mapping.id)}
                              </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center">
                                                                    <FileText className="w-4 h-4 text-blue-600 mr-1" />
                                                                    <span className="text-xs font-semibold text-gray-600 uppercase">
                                    File
                                  </span>
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                                    <code className="text-xs text-blue-800 break-all font-medium">
                                                                        {sourceParts.file}
                                                                    </code>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex items-center">
                                                                    <Grid className="w-4 h-4 text-indigo-600 mr-1" />
                                                                    <span className="text-xs font-semibold text-gray-600 uppercase">
                                    Sheet
                                  </span>
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-indigo-200">
                                                                    <code className="text-xs text-indigo-800 break-all font-medium">
                                                                        {sourceParts.sheet}
                                                                    </code>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex items-center">
                                                                    <Layers className="w-4 h-4 text-purple-600 mr-1" />
                                                                    <span className="text-xs font-semibold text-gray-600 uppercase">
                                    Column
                                  </span>
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-purple-200">
                                                                    <code className="text-xs text-purple-800 break-all font-medium">
                                                                        {sourceParts.column}
                                                                    </code>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Destination Tables */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Table className="w-6 h-6 text-green-600 mr-2" />
                                Destination Tables
                                <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {selectedExport.destination_tables?.length ?? 0} tables
                </span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedExport.destination_tables?.map((table) => (
                                <div
                                    key={table.id ?? table.name}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                                >
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                                                <Table className="w-5 h-5 text-white" />
                                            </div>
                                            <h4 className="font-bold text-white text-lg">
                                                {table.name}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        {table.columns && table.columns.length > 0 ? (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 mb-3">
                                                    Columns ({table.columns.length})
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {table.columns.map((column, index) => (
                                                        <span
                                                            key={`${table.name}-${index}-${column}`}
                                                            className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-xs font-medium hover:from-blue-100 hover:to-blue-200 hover:text-blue-800 transition-colors"
                                                        >
                              {column}
                            </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">
                                                No columns defined
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                            <button
                                onClick={() => downloadExport(selectedExport)}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-md hover:shadow-lg"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download JSON</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Important: default export preserves generics */
export default BeautifulDetailsModal;
