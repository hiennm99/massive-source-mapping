import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    globalFilter: string;
    setGlobalFilter: (filter: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ globalFilter, setGlobalFilter }) => {
    return (
        <div className="bg-white p-4 border-b border-gray-200">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search all columns across all groups..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
                {globalFilter && (
                    <button
                        onClick={() => setGlobalFilter('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>
        </div>
    );
};