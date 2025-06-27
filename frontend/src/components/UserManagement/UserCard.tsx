import React from 'react';
import { User } from '../../types/User';
import { Edit3, Trash2, Shield, User as UserIcon, Mail, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserCardProps {
  user: User;
  isSelected: boolean;
  isEditing: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onSelect: (id: number, selected: boolean) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isSelected,
  isEditing,
  onEdit,
  onDelete,
  onSelect
}) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-900 text-purple-300 border-purple-700';
      case 'staff': return 'bg-blue-900 text-blue-300 border-blue-700';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getStatusColor = (active: number) => {
    return active ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300';
  };

  return (
    <label // full card is clickable
      className={`relative cursor-pointer block bg-gray-800 rounded-xl shadow-sm border transition-all duration-200 p-6 ${
        isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'
      } ${isEditing ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
    >
      {/* Hidden checkbox for selection */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(user.id, e.target.checked)}
        className="absolute opacity-0 inset-0 w-full h-full z-0"
      />

      {/* Content inside card */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          {/* Avatar + Info */}
          <div className="flex items-center space-x-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white">{user.username}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.active)}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${user.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit/Delete buttons (inside card, properly aligned) */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
              className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit user"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user);
              }}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Delete user"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email and timestamps */}
        <div className="space-y-2 text-sm text-gray-300">
          {user.email && (
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Created {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
          </div>
          {user.last_login && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Last login {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </div>
    </label>
  );
};

export default UserCard;
