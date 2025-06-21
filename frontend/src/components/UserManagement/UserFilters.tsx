import React from 'react';
import { Search, Filter, Download, Trash2, Plus, RefreshCw } from 'lucide-react';
import { UserFilters as UserFiltersType } from '../../types/User';

interface UserFiltersProps {
  filters: UserFiltersType;
  selectedCount: number;
  totalCount: number;
  isLoading: boolean;
  onFiltersChange: (filters: Partial<UserFiltersType>) => void;
  onAddUser: () => void;
  onDeleteSelected: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  selectedCount,
  totalCount,
  isLoading,
  onFiltersChange,
  onAddUser,
  onDeleteSelected,
  onExport,
  onRefresh
}) => {
  return (
    <div className="bg-gray-800 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-white pl-10 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
            /> 
          </div>
          
          <div className="flex space-x-2">
            <select
              value={filters.role}
              onChange={(e) => onFiltersChange({ role: e.target.value })}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="user">User</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ status: e.target.value })}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-white hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onExport}
            className="flex items-center px-3 py-2 text-white hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
          
          {selectedCount > 0 && (
            <button
              onClick={onDeleteSelected}
              className="flex items-center px-3 py-2 text-red-50 bg-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete ({selectedCount})
            </button>
          )}
          
          <button
            onClick={onAddUser}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add User
          </button>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-white">
        <span>
          Showing {totalCount} user{totalCount !== 1 ? 's' : ''}
          {selectedCount > 0 && ` (${selectedCount} selected)`}
        </span>
        
        <div className="flex items-center space-x-4">
          <span>Sort by:</span>
          <select
            value={`${filters.sortField}-${filters.sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onFiltersChange({ 
                sortField: field as any, 
                sortOrder: order as 'asc' | 'desc' 
              });
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="username-asc">Username A-Z</option>
            <option value="username-desc">Username Z-A</option>
            <option value="role-asc">Role A-Z</option>
            <option value="last_login-desc">Last Login</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;