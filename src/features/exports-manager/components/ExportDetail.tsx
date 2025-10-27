import { useMemo, memo } from "react";
import type {JSX} from "react";
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
    Briefcase,
    DollarSign,
} from "lucide-react";

/** ===== Types ===== */
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
        base?: {[key: string]: MappingSource};
        jobs?: Array<{[key: string]: MappingSource}>;
        finance?: Array<{[key: string]: MappingSource}>;
        guarantors?: Array<{[key: string]: MappingSource}>;
        joints?: Array<{[key: string]: MappingSource}>;
        assets?: Array<{[key: string]: MappingSource}>;
        [key: string]: any;
    };
}

interface BeautifulDetailsModalProps {
    selectedExport: MappingExport | null | undefined;
    showDetails: boolean;
    setShowDetails: (v: boolean) => void;
    formatDate: (d: string) => string;
}

interface ArrayMappingConfig {
    title: string;
    icon: JSX.Element;
    colorClass: string;
}

/** ===== Constants ===== */
const ARRAY_MAPPING_KEYS = ['jobs', 'finance', 'guarantors', 'joints', 'assets'] as const;

const ARRAY_MAPPING_CONFIGS: Record<string, ArrayMappingConfig> = {
    jobs: {
        title: "Jobs",
        icon: <Briefcase className="w-5 h-5 text-white" />,
        colorClass: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    finance: {
        title: "Finance",
        icon: <DollarSign className="w-5 h-5 text-white" />,
        colorClass: "bg-gradient-to-r from-emerald-500 to-emerald-600"
    },
    guarantors: {
        title: "Guarantors",
        icon: <Users className="w-5 h-5 text-white" />,
        colorClass: "bg-gradient-to-r from-green-500 to-green-600"
    },
    joints: {
        title: "Joint Borrowers",
        icon: <Link className="w-5 h-5 text-white" />,
        colorClass: "bg-gradient-to-r from-purple-500 to-purple-600"
    },
    assets: {
        title: "Assets",
        icon: <Building className="w-5 h-5 text-white" />,
        colorClass: "bg-gradient-to-r from-orange-500 to-orange-600"
    }
};

/** ===== Utilities ===== */
const toStr = (v: unknown): string => (v == null ? "" : String(v));

const shortId = (id: unknown, take = 8): string => {
    const s = toStr(id);
    return !s ? "N/A" : s.length > take ? `${s.slice(0, take)}...` : s;
};

const normalizeDateInput = (v: string | number | Date): string => {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "number") return new Date(v).toISOString();
    if (typeof v === "string") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toISOString();
    }
    return toStr(v);
};

const capitalizeLabel = (str: string): string =>
    str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

/** ===== Memoized Sub-Components ===== */
const SourceField = memo(({
                              icon,
                              label,
                              value,
                              colorBorder,
                              colorText
                          }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    colorBorder: string;
    colorText: string;
}) => (
    <div className="space-y-2">
        <div className="flex items-center">
            {icon}
            <span className="text-xs font-semibold text-gray-600 uppercase">{label}</span>
        </div>
        <div className={`bg-white p-3 rounded-lg border ${colorBorder}`}>
            <code className={`text-xs ${colorText} break-all font-medium`}>
                {value}
            </code>
        </div>
    </div>
));

const MappingSourceComponent = memo(({
                                         source,
                                         label,
                                         icon
                                     }: {
    source: MappingSource;
    label: string;
    icon: React.ReactNode;
}) => (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-900 flex items-center">
                {icon}
                {label}
            </h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SourceField
                icon={<FileText className="w-4 h-4 text-blue-600 mr-1" />}
                label="File"
                value={source.file}
                colorBorder="border-blue-200"
                colorText="text-blue-800"
            />
            <SourceField
                icon={<Grid className="w-4 h-4 text-indigo-600 mr-1" />}
                label="Sheet"
                value={source.sheet}
                colorBorder="border-indigo-200"
                colorText="text-indigo-800"
            />
            <SourceField
                icon={<Layers className="w-4 h-4 text-purple-600 mr-1" />}
                label="Column"
                value={source.column}
                colorBorder="border-purple-200"
                colorText="text-purple-800"
            />
        </div>
    </div>
));

const StatCard = memo(({
                           icon,
                           value,
                           label,
                           bgColor
                       }: {
    icon: React.ReactNode;
    value: number | string;
    label: string;
    bgColor: string;
}) => (
    <div className="text-center">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
            {icon}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
    </div>
));

const ArrayMappingItem = memo(({
                                   item,
                                   itemIndex,
                                   config
                               }: {
    item: {[key: string]: MappingSource};
    itemIndex: number;
    config: ArrayMappingConfig;
}) => {
    const entries = Object.entries(item);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
            <div className={`${config.colorClass} p-4`}>
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            {config.icon}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold">
                                {config.title.slice(0, -1)} #{itemIndex + 1}
                            </h4>
                            <p className="text-sm opacity-90">
                                {entries.length} field{entries.length > 1 ? 's' : ''} mapped
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-4">
                {entries.map(([fieldKey, fieldSource]) => {
                    const colorClass = config.colorClass.includes('blue') ? 'bg-blue-100 text-blue-600' :
                        config.colorClass.includes('emerald') ? 'bg-emerald-100 text-emerald-600' :
                            config.colorClass.includes('green') ? 'bg-green-100 text-green-600' :
                                config.colorClass.includes('purple') ? 'bg-purple-100 text-purple-600' :
                                    'bg-orange-100 text-orange-600';

                    return (
                        <MappingSourceComponent
                            key={fieldKey}
                            source={fieldSource}
                            label={capitalizeLabel(fieldKey)}
                            icon={
                                <div className={`w-6 h-6 ${colorClass} rounded-lg flex items-center justify-center mr-2`}>
                                    <span className="text-xs font-bold">
                                        {fieldKey.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
});

const ArrayMappings = memo(({
                                items,
                                config
                            }: {
    items: Array<{[key: string]: MappingSource}>;
    config: ArrayMappingConfig;
}) => {
    if (!items?.length) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="mr-2">{config.icon}</span>
                    {config.title}
                    <span className={`ml-2 px-3 py-1 ${config.colorClass} text-white rounded-full text-sm font-medium`}>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                </h3>
            </div>
            <div className="space-y-6">
                {items.map((item, idx) => (
                    <ArrayMappingItem key={idx} item={item} itemIndex={idx} config={config} />
                ))}
            </div>
        </div>
    );
});

/** ===== Custom Hook ===== */
const useMappingStats = (mappings: MappingExport['mappings']) => {
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

        ARRAY_MAPPING_KEYS.forEach(key => {
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

/** ===== Main Component ===== */
export function ExportDetail({
                                   selectedExport,
                                   showDetails,
                                   setShowDetails,
                                   formatDate,
                               }: BeautifulDetailsModalProps) {
    const stats = useMappingStats(selectedExport?.mappings || {});

    const formattedDates = useMemo(() => {
        if (!selectedExport) return { created: '', updated: '' };
        return {
            created: formatDate(normalizeDateInput(selectedExport.created_at)),
            updated: formatDate(normalizeDateInput(selectedExport.updated_at))
        };
    }, [selectedExport, formatDate]);

    if (!showDetails || !selectedExport) return null;

    const handleClose = () => setShowDetails(false);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Export Details</h2>
                                <p className="text-blue-100 font-medium">{selectedExport.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] bg-gradient-to-br from-gray-50 to-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-3">
                                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                                <h3 className="font-semibold text-gray-900">Created Date</h3>
                            </div>
                            <p className="text-gray-600 text-lg font-medium">{formattedDates.created}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-3">
                                <Clock className="w-5 h-5 text-green-600 mr-2" />
                                <h3 className="font-semibold text-gray-900">Last Updated</h3>
                            </div>
                            <p className="text-gray-600 text-lg font-medium">{formattedDates.updated}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 border border-blue-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Hash className="w-5 h-5 text-blue-600 mr-2" />
                            Overview Statistics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={<MapPin className="w-6 h-6 text-blue-600" />}
                                value={stats.totalMappings}
                                label="Total Mappings"
                                bgColor="bg-blue-100"
                            />
                            <StatCard
                                icon={<FileText className="w-6 h-6 text-green-600" />}
                                value={stats.uniqueFiles.size}
                                label="Unique Files"
                                bgColor="bg-green-100"
                            />
                            <StatCard
                                icon={<Grid className="w-6 h-6 text-purple-600" />}
                                value={stats.uniqueSheets.size}
                                label="Unique Sheets"
                                bgColor="bg-purple-100"
                            />
                            <StatCard
                                icon={<FolderTree className="w-6 h-6 text-orange-600" />}
                                value={shortId(selectedExport.id)}
                                label="Export ID"
                                bgColor="bg-orange-100"
                            />
                        </div>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Table className="w-6 h-6 text-green-600 mr-2" />
                                Source Files & Sheets
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-white text-lg">Source Files ({stats.uniqueFiles.size})</h4>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-2">
                                        {Array.from(stats.uniqueFiles).map((file) => (
                                            <div key={file} className="flex items-center p-2 bg-gray-50 rounded-lg">
                                                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                                                <span className="text-sm font-medium text-gray-700 truncate">{file}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                                            <Grid className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-bold text-white text-lg">Sheets Used ({stats.uniqueSheets.size})</h4>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(stats.uniqueSheets).map((sheet) => (
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
                    {selectedExport.mappings.base && Object.keys(selectedExport.mappings.base).length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Target className="w-6 h-6 text-blue-600 mr-2" />
                                    Base Fields
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(selectedExport.mappings.base).map(([key, value]) => (
                                    <MappingSourceComponent
                                        key={key}
                                        source={value}
                                        label={capitalizeLabel(key)}
                                        icon={
                                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                                <span className="text-xs font-bold text-blue-600">
                                                    {key.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {ARRAY_MAPPING_KEYS.map(key => {
                        const items = selectedExport.mappings[key];
                        return Array.isArray(items) && items.length > 0 ? (
                            <ArrayMappings key={key} items={items} config={ARRAY_MAPPING_CONFIGS[key]} />
                        ) : null;
                    })}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Export ID:{" "}
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                                {toStr(selectedExport.id) || "N/A"}
                            </code>
                        </div>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExportDetail;