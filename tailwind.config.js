/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Your existing colors from App.css
        primary: 'var(--primary-color)',
        'primary-hover': 'var(--primary-hover)',
        secondary: 'var(--secondary-color)',
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        danger: 'var(--danger-color)',
        info: 'var(--info-color)',
        
        // Background colors
        background: 'var(--sidebar-bg)',
        sidebar: 'var(--sidebar-bg)',
        header: 'var(--header-bg)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        
        // Card backgrounds
        card: 'var(--card-bg)',
        'card-secondary': 'var(--card-secondary-bg)',
        'card-hover': 'var(--card-hover-bg)',
        
        // Border colors
        border: 'var(--border-color)',
        'border-light': 'var(--border-light)',
        'border-dark': 'var(--border-dark)',
        
        // Status colors
        'status-completed': 'var(--status-completed)',
        'status-pending': 'var(--status-pending)',
        'status-cancelled': 'var(--status-cancelled)',
        'status-refunded': 'var(--status-refunded)',
        'status-processing': 'var(--status-processing)',
        'status-onhold': 'var(--status-onhold)',
        
        // Stock status
        'stock-instock': 'var(--stock-instock)',
        'stock-lowstock': 'var(--stock-lowstock)',
        'stock-outstock': 'var(--stock-outstock)',
        'stock-preorder': 'var(--stock-preorder)',
        
        // Payment method colors
        'payment-cash': 'var(--payment-cash)',
        'payment-card': 'var(--payment-card)',
        'payment-digital': 'var(--payment-digital)',
        'payment-credit': 'var(--payment-credit)',
        'payment-cod': 'var(--payment-cod)',
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-left': 'fade-in-left 0.5s ease-out',
        'fade-in-right': 'fade-in-right 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'ripple': 'ripple 1s linear forwards',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'medium': '0 6px 30px rgba(0, 0, 0, 0.12)',
        'hard': '0 8px 40px rgba(0, 0, 0, 0.16)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}