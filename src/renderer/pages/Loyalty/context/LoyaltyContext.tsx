import React, { createContext, useContext, useState, type ReactNode} from 'react';

interface LoyaltyContextType {
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  isAdjustPointsModalOpen: boolean;
  setIsAdjustPointsModalOpen: (open: boolean) => void;
  isRewardsModalOpen: boolean;
  setIsRewardsModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  activeTab: 'members' | 'rewards' | 'redemptions' | 'settings';
  setActiveTab: (tab: 'members' | 'rewards' | 'redemptions' | 'settings') => void;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isAdjustPointsModalOpen, setIsAdjustPointsModalOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'members' | 'rewards' | 'redemptions' | 'settings'>('members');

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <LoyaltyContext.Provider
      value={{
        selectedCustomerId,
        setSelectedCustomerId,
        isAdjustPointsModalOpen,
        setIsAdjustPointsModalOpen,
        isRewardsModalOpen,
        setIsRewardsModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        refreshTrigger,
        triggerRefresh,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyaltyContext = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyaltyContext must be used within LoyaltyProvider');
  }
  return context;
};