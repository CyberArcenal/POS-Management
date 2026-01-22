import React, { createContext, useContext, useState, type ReactNode} from 'react';
import type { User, UserFilters } from '../types/user.types';

interface UserContextType {
  selectedUsers: number[];
  setSelectedUsers: (ids: number[]) => void;
  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  currentEditingUser: User | null;
  setCurrentEditingUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filters, setFilters] = useState<UserFilters>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentEditingUser, setCurrentEditingUser] = useState<User | null>(null);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <UserContext.Provider
      value={{
        selectedUsers,
        setSelectedUsers,
        filters,
        setFilters,
        refreshTrigger,
        triggerRefresh,
        currentEditingUser,
        setCurrentEditingUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};