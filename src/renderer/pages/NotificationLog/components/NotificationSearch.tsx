import React from 'react';
import { Search } from 'lucide-react';

interface NotificationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const NotificationSearch: React.FC<NotificationSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by recipient, subject, or payload...',
}) => {
  return (
    <div className="relative w-full md:w-96">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-[var(--text-tertiary)]" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[var(--card-bg)] border-[var(--border-color)]/20 
                   text-[var(--text-primary)] placeholder-[var(--text-tertiary)]
                   focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/50 
                   transition-all duration-200"
      />
    </div>
  );
};