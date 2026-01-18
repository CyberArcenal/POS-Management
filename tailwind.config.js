// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        'primary-hover': 'var(--primary-hover)',
        secondary: 'var(--secondary-color)',
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        danger: 'var(--danger-color)',
        info: 'var(--info-color)',
        
        // Backgrounds
        background: 'var(--background-color)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'header-bg': 'var(--header-bg)',
        
        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        
        // Cards
        'card-bg': 'var(--card-bg)',
        'card-secondary-bg': 'var(--card-secondary-bg)',
        'card-hover-bg': 'var(--card-hover-bg)',
        
        // Borders
        border: 'var(--border-color)',
        'border-light': 'var(--border-light)',
        'border-dark': 'var(--border-dark)',
        
        // Status colors
        'status-completed': 'var(--status-completed)',
        'status-pending': 'var(--status-pending)',
        'status-cancelled': 'var(--status-cancelled)',
        
        // Stock
        'stock-instock': 'var(--stock-instock)',
        'stock-lowstock': 'var(--stock-lowstock)',
        'stock-outstock': 'var(--stock-outstock)',
        
        // Accents
        'accent-blue': 'var(--accent-blue)',
        'accent-green': 'var(--accent-green)',
        'accent-red': 'var(--accent-red)',
        'accent-amber': 'var(--accent-amber)',
        'accent-purple': 'var(--accent-purple)',
        
        // Status backgrounds
        'status-completed-bg': 'var(--status-completed-bg)',
        'status-pending-bg': 'var(--status-pending-bg)',
        'status-cancelled-bg': 'var(--status-cancelled-bg)',
        
        // Buttons
        'btn-primary-bg': 'var(--btn-primary-bg)',
        'btn-primary-text': 'var(--btn-primary-text)',
        'btn-danger-bg': 'var(--btn-danger-bg)',
        'btn-danger-text': 'var(--btn-danger-text)',
        
        // Receipt
        'receipt-total': 'var(--receipt-total)',
        
        // Input
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'input-focus': 'var(--input-focus)',
      },
      spacing: {
        'size-sm': '8px',
        'size-md': '16px',
        'size-lg': '24px',
        'size-xl': '32px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      }
    },
  },
  plugins: [],
}