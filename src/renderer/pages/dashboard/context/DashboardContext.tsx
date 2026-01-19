import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { DashboardFilters } from "../types";


interface DashboardState {
  filters: DashboardFilters;
  refreshKey: number;
  isLoading: boolean;
  lastUpdated: string | null;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
  }>;
}

type DashboardAction =
  | { type: 'SET_FILTERS'; payload: Partial<DashboardFilters> }
  | { type: 'REFRESH_DATA' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LAST_UPDATED'; payload: string }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<DashboardState['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: DashboardState = {
  filters: {
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
    },
    period: 'month',
    category: null,
    paymentMethod: null,
  },
  refreshKey: 0,
  isLoading: false,
  lastUpdated: null,
  theme: 'light',
  notifications: [],
};

const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | undefined>(undefined);

const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        refreshKey: state.refreshKey + 1,
      };
    case 'REFRESH_DATA':
      return {
        ...state,
        refreshKey: state.refreshKey + 1,
        lastUpdated: new Date().toISOString(),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_LAST_UPDATED':
      return {
        ...state,
        lastUpdated: action.payload,
      };
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            ...action.payload,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
          },
        ].slice(-5), // Keep only last 5 notifications
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    default:
      return state;
  }
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};