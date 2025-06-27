import React, { useState, useMemo, useCallback } from 'react';
import { useUsers } from '../../context/UserContext';
import { User, UserFilters as UserFiltersType, CreateUserPayload, UpdateUserPayload } from '../../types/User';
import { Users, Grid, List } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import UserForm from './UserForm';
import UserFilters from './UserFilters';
import UserCard from './UserCard';
import DeleteConfirmModal from './DeleteConfirmModal';

const UserManagement: React.FC = () => {
  const { users, loading, addUser, updateUser, deleteUser, deleteUsers, refreshUsers } = useUsers();
  
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; users: Array<{ id: number; username: string }> }>({
    isOpen: false,
    users: []
  });
  
  const [filters, setFilters] = useState<UserFiltersType>({
    search: '',
    role: '',
    status: '',
    sortField: 'created_at',
    sortOrder: 'desc'
  });

  // Debounced search
  const [searchTerm, setSearchTerm] = useState(filters.search);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Apply search filter
    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search) ||
        user.id.toString().includes(search)
      );
    }

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Apply status filter
    if (filters.status) {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(user => !!user.active === isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
    const aValue = a[filters.sortField] ?? '';
    const bValue = b[filters.sortField] ?? '';
      
      if (aValue === bValue) return 0;
      
    const result = String(aValue).localeCompare(String(bValue));
      return filters.sortOrder === 'asc' ? result : -result;
    });

    return filtered;
  }, [users, filters]);

  const handleFiltersChange = useCallback((newFilters: Partial<UserFiltersType>) => {
    if ('search' in newFilters) {
      setSearchTerm(newFilters.search!);
    } else {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = (user: User) => {
    setDeleteModal({
      isOpen: true,
      users: [{ id: user.id, username: user.username }]
    });
  };

  const handleDeleteSelected = () => {
    const usersToDelete = Array.from(selectedUsers).map(id => {
      const user = users.find(u => u.id === id);
      return { id, username: user?.username || `User ${id}` };
    });
    
    setDeleteModal({
      isOpen: true,
      users: usersToDelete
    });
  };

  const handleSaveUser = async (payload: CreateUserPayload | UpdateUserPayload) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload as UpdateUserPayload);
        toast.success('User updated successfully!');
      } else {
        await addUser(payload as CreateUserPayload);
        toast.success('User created successfully!');
      }
      setShowForm(false);
      setEditingUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const userIds = deleteModal.users.map(u => u.id);
      
      if (userIds.length === 1) {
        await deleteUser(userIds[0]);
        toast.success('User deleted successfully!');
      } else {
        await deleteUsers(userIds);
        toast.success(`${userIds.length} users deleted successfully!`);
      }
      
      setSelectedUsers(new Set());
      setDeleteModal({ isOpen: false, users: [] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete users');
    }
  };

  const handleSelectUser = (id: number, selected: boolean) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Username', 'Email', 'Role', 'Status', 'Created', 'Last Login'],
      ...filteredUsers.map(user => [
        user.id,
        user.username,
        user.email || '',
        user.role,
        user.active ? 'Active' : 'Inactive',
        user.created_at,
        user.last_login || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Users exported successfully!');
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-white">Manage user accounts, roles, and permissions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-purple-700 text-white' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-purple-700 text-white' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Form */}
      {showForm && (
        <UserForm
          user={editingUser}
          isLoading={loading}
          onSave={handleSaveUser}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Filters */}
      <UserFilters
        filters={{ ...filters, search: searchTerm }}
        selectedCount={selectedUsers.size}
        totalCount={filteredUsers.length}
        isLoading={loading}
        onFiltersChange={handleFiltersChange}
        onAddUser={handleAddUser}
        onDeleteSelected={handleDeleteSelected}
        onExport={handleExport}
        onRefresh={refreshUsers}
      />

      {/* Users Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.role || filters.status 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first user.'}
          </p>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Add First User
          </button>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredUsers.map(user => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUsers.has(user.id)}
              isEditing={editingUser?.id === user.id}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onSelect={handleSelectUser}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        users={deleteModal.users}
        isLoading={loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, users: [] })}
      />
    </div>
  );
};

export default UserManagement;