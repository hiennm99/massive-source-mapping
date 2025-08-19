import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Download, Plus, Calendar, Database, RefreshCw, AlertCircle, CheckCircle, Clock, Loader } from 'lucide-react';
import Navbar from "./Navbar.tsx";
import BeautifulDetailsModal from "./BeautifulDetailsModal.tsx";

// Import all API functions từ service
import {
    getMappingExports,
    deleteMappingExport,
    searchMappingExports,
    getMappingStats,
} from '../services/mappingExportService2';
import {useNavigate} from "react-router";

// Type definitions
interface MappingExport {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    mappings?: Mapping[];
    destination_tables?: DestinationTable[];
}

interface Mapping {
    id: string;
    source: {
        path: string;
        value: string;
    };
    destination: {
        table: string;
        column: string;
    };
}

interface DestinationTable {
    id: string;
    name: string;
    columns?: string[];
}

interface Stats {
    total_mappings: number;
    timestamp: string;
}

const MappingExportsManager = () => {
    const navigate = useNavigate();
    const [exports, setExports] = useState<MappingExport[]>([]);
    const [filteredExports, setFilteredExports] = useState<MappingExport[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExport, setSelectedExport] = useState<MappingExport | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [error, setError] = useState('');
    const [, setStats] = useState<Stats>({
        total_mappings: 0,
        timestamp: new Date().toISOString()
    });

    // Initial data loading
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsInitialLoading(true);
        setError('');

        try {
            // Load both exports and stats in parallel
            const [exportsData, statsData] = await Promise.all([
                getMappingExports(),
                getMappingStats()
            ]);

            setExports(exportsData as unknown as MappingExport[]);
            setStats(statsData as Stats);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        } finally {
            setIsInitialLoading(false);
        }
    };

    // Filter exports based on search term
    useEffect(() => {
        const performSearch = async () => {
            if (!searchTerm.trim()) {
                setFilteredExports(exports);
                return;
            }

            try {
                const searchResults = await searchMappingExports(searchTerm.trim());
                setFilteredExports(searchResults as unknown as MappingExport[]);
            } catch (error) {
                console.error('Search failed:', error);
                // Fallback to local filtering if search API fails
                const filtered = exports.filter(exp =>
                    exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (exp.mappings && exp.mappings.some(mapping =>
                        mapping.source.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        mapping.destination.table.toLowerCase().includes(searchTerm.toLowerCase())
                    ))
                );
                setFilteredExports(filtered);
            }
        };

        const debounceTimer = setTimeout(performSearch, 500);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, exports]);

    // Sort exports
    const sortedExports = [...filteredExports].sort((a, b) => {
        const aVal = sortBy === 'created_at' ? new Date(a.created_at).getTime() : a.name.toLowerCase();
        const bVal = sortBy === 'created_at' ? new Date(b.created_at).getTime() : b.name.toLowerCase();

        if (sortOrder === 'desc') {
            return aVal > bVal ? -1 : 1;
        }
        return aVal < bVal ? -1 : 1;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa export này không?')) {
            setIsLoading(true)
            try {
                await deleteMappingExport(id);
                setExports(prev => prev.filter(exp => exp.id !== id));
                setFilteredExports(prev => prev.filter(exp => exp.id !== id));

                // Update stats
                const updatedStats = await getMappingStats();
                setStats(updatedStats as Stats);

                alert('Đã xóa export thành công!');
            } catch (error: unknown) {
                console.error('Delete failed:', error);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                alert(`Có lỗi xảy ra khi xóa export: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Handle Update Export
    const handleViewDetails = (exportItem: MappingExport) => {
        setSelectedExport(exportItem);
        setShowDetails(true);
    };

    const refreshExports = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [exportsData, statsData] = await Promise.all([
                getMappingExports(),
                getMappingStats()
            ]);

            setExports(exportsData as unknown as MappingExport[]);
            setStats(statsData as Stats);

            // Clear search term to show all data
            setSearchTerm('');

            alert('Đã Refresh danh sách thành công!');
        }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
        catch (error: never) {
            console.error('Refresh failed:', error);
            setError('Không thể Refresh dữ liệu. Vui lòng thử lại sau.');
            alert(`Có lỗi xảy ra khi Refresh: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadExport = (exportItem: MappingExport) => {
        const dataStr = JSON.stringify(exportItem, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `${exportItem.name.replace(/[^a-z0-9]/gi, '_')}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Calculate derived stats - với null check
    const totalMappings = exports.reduce((acc, exp) => acc + (exp.mappings ? exp.mappings.length : 0), 0);
    const totalTables = exports.reduce((acc, exp) => acc + (exp.destination_tables ? exp.destination_tables.length : 0), 0);
    const recentExports = exports.filter(exp =>
        new Date(exp.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-sm border flex items-center space-x-4">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Loading data...</h3>
                        <p className="text-gray-600">Wait a second</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Mapping Exports Manager
                                </h1>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={refreshExports}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    onClick={() => navigate("/")}
                                >
                                    <Plus className="w-4 h-4" />
                                    Create New Export
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center">
                                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                    <span className="text-red-800">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Database className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Exports</p>
                                        <p className="text-xl font-semibold">{exports.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Active Mappings</p>
                                        <p className="text-xl font-semibold">{totalMappings}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Database className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Tables</p>
                                        <p className="text-xl font-semibold">{totalTables}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Recent</p>
                                        <p className="text-xl font-semibold">{recentExports}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Find exports..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'created_at' | 'name')}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="created_at">Created Date</option>
                                    <option value="name">Name</option>
                                </select>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="desc">Newest</option>
                                    <option value="asc">Oldest</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Exports List */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        {sortedExports.length === 0 ? (
                            <div className="p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Not Found
                                </h3>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Export Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mappings
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tables
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedExports.map((exportItem) => (
                                        <tr key={exportItem.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <Database className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {exportItem.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {exportItem.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {exportItem.mappings ? exportItem.mappings.length : 0} mappings
                                                </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {exportItem.destination_tables && exportItem.destination_tables.map(table => (
                                                        <span key={table.id} className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-1 mb-1">
                                                        {table.name}
                                                    </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {formatDate(exportItem.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetails(exportItem)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => downloadExport(exportItem)}
                                                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exportItem.id)}
                                                        disabled={isLoading}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Details Modal */}
                    <BeautifulDetailsModal
                        selectedExport={selectedExport}
                        showDetails={showDetails}
                        setShowDetails={setShowDetails}
                        downloadExport={downloadExport}
                        formatDate={formatDate}
                    />

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg flex items-center space-x-3">
                                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                                <span>Processing...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MappingExportsManager;