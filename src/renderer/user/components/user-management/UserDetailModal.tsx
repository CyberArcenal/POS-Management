import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useUserMutations } from '../../hooks/useUserMutations';
import type { User, UserFormData } from '../../types/user.types';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  status: z.enum(['active', 'inactive', 'suspended']),
  department: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    display_name: '',
    username: '',
    roles: ['user'],
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { updateUser, updatePassword, isLoading, error: mutationError } = useUserMutations();

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        display_name: user.display_name,
        username: user.username,
        roles: user.roles,
        status: user.status,
        department: user.department,
        phone: user.phone,
        notes: user.notes,
      });
    } else {
      resetForm();
    }
  }, [user]);

  const resetForm = () => {
    setFormData({
      email: '',
      display_name: '',
      username: '',
      roles: ['user'],
      status: 'active',
    });
    setErrors({});
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'roles') {
      const select = e.target as HTMLSelectElement;
      const selectedRoles = Array.from(select.selectedOptions, option => option.value);
      setFormData(prev => ({ ...prev, roles: selectedRoles }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      userSchema.parse(formData);
      setErrors({});

      if (user) {
        await updateUser(user.id, formData);
        
        // Handle password change if provided
        if (newPassword && confirmPassword) {
          if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
          }
          await updatePassword(user.id, currentPassword, newPassword);
        }
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error: { path: string[]; message: string; }) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const roles = ['admin', 'manager', 'cashier', 'inventory', 'user'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                {user ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {mutationError && (
              <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded">
                {mutationError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-gray-900 border rounded text-white focus:outline-none focus:ring-1 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-gray-900 border rounded text-white focus:outline-none focus:ring-1 ${
                      errors.display_name
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.display_name && (
                    <p className="mt-1 text-sm text-red-400">{errors.display_name}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-gray-900 border rounded text-white focus:outline-none focus:ring-1 ${
                      errors.username
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Roles *
                  </label>
                  <select
                    name="roles"
                    multiple
                    value={formData.roles}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.roles && (
                    <p className="mt-1 text-sm text-red-400">{errors.roles}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Password Fields (for existing users) */}
                {user && (
                  <div className="md:col-span-2">
                    <div className="border-t border-gray-700 pt-4 mt-4">
                      <h4 className="text-lg font-medium text-white mb-3">Change Password</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Current Password
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            New Password
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Confirm Password
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {passwordError && (
                        <p className="mt-2 text-sm text-red-400">{passwordError}</p>
                      )}
                      <div className="mt-3 flex items-center">
                        <input
                          type="checkbox"
                          id="showPassword"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                          className="h-4 w-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showPassword" className="ml-2 text-sm text-gray-400">
                          Show passwords
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Leave password fields blank to keep current password
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center"
                >
                  {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {user ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};