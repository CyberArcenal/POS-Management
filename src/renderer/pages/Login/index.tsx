import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    DollarSign,
    Package,
    Lock,
    Mail,
    Eye,
    EyeOff,
    AlertCircle,
    LogIn,
    Shield,
    Clock,
    BarChart,
    Users
} from 'lucide-react';
import { posAuthStore } from '../../lib/authStore';
import userAPI from '../../api/user';
import { dialogs } from '../../utils/dialogs';

const POSLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        // Validate inputs
        if (!username.trim()) {
            setError('Please enter your username');
            setLoading(false);
            return;
        }

        if (!password.trim()) {
            setError('Please enter your password');
            setLoading(false);
            return;
        }

        // Call the userAPI for authentication
        const response = await userAPI.validateUserCredentials(
            username.trim(),
            password.trim()
        );
        console.log('Login response:', response);

        // FIXED: Check if response is successful and contains user data
        if (response.status === true && response.data && response.data.user) {
            const user = response.data.user;

            // Get user permissions for POS
            const permissionsResponse = await userAPI.getUserPermissions(user.id);

            // Extract permissions - adjust based on actual API response
            const permissions = permissionsResponse.data?.permissions || {};
            
            // If permissions response has direct boolean fields, use them
            // Otherwise, check the structure from the user response
            const canManageProducts = permissions['can_manage_products'] !== undefined 
                ? permissions['can_manage_products']
                : user.can_manage_products || false;
                
            const canAdjustInventory = permissions['can_adjust_inventory'] !== undefined
                ? permissions['can_adjust_inventory']
                : user.can_adjust_inventory || false;
                
            const canViewReports = permissions['can_view_reports'] !== undefined
                ? permissions['can_view_reports']
                : user.can_view_reports || false;

            // Map API response to auth store format for POS
            const posUser = {
                id: user.id,
                username: user.username,
                email: user.email || `${user.username}@pos.local`,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                display_name: user.display_name || user.username,
                employee_id: user.employee_id,
                department: user.department,
                is_active: user.is_active,
                // Convert permissions object to array of keys with true values
                permissions: Object.entries(permissions)
                    .filter(([_, value]) => value === true)
                    .map(([key]) => key),
                can_manage_products: canManageProducts,
                can_adjust_inventory: canAdjustInventory,
                can_view_reports: canViewReports,
                last_login_at: new Date().toISOString(),
                created_at: user.created_at || new Date().toISOString(),
                updated_at: user.updated_at || new Date().toISOString()
            };

            // Generate token for offline mode
            const token = `pos_token_${Date.now()}_${user.id}`;

            // Save to auth store (offline mode)
            posAuthStore.setAuthData({
                user: posUser,
                token: token,
                expiresIn: 8 * 60 * 60 // 8 hours shift
            });

            // Log the login activity
            await userAPI.logUserLogin({
                user_id: user.id,
                username: user.username,
                ip_address: '127.0.0.1',
                user_agent: navigator.userAgent
            });

            // Check if first user/admin
            const usersResponse = await userAPI.getAllUsers();
            const userCount = usersResponse.data?.length || 0;

            if (userCount === 1 && user.role.toLowerCase().includes('admin')) {
                await dialogs.info('Welcome! You are the first administrator of POS Management System.');
            }

            // Navigate to POS dashboard
            navigate('/dashboard');
        } else {
            // FIXED: Use response.message if available, otherwise default message
            setError(response.message || 'Invalid username or password');
            console.log('Login failed:', response);
        }

    } catch (err: any) {
        // Handle specific error cases
        if (err.message === "Electron API not available") {
            setError('Application backend is not available. Please restart the application.');
        } else if (err.message?.includes('network')) {
            setError('Network error. Please check your connection.');
        } else if (err.message?.includes('Login failed')) {
            setError('Invalid username or password');
        } else {
            setError(err.message || 'An unexpected error occurred during login');
        }
        console.error('Login error:', err);
    } finally {
        setLoading(false);
    }
};

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background-color)',
            padding: '2rem',
            fontFamily: "'Segoe UI', system-ui, sans-serif"
        }}>
            {/* Main Container - Wider for Desktop App */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                maxWidth: '1200px',
                width: '100%',
                height: '700px',
                background: 'var(--card-bg)',
                borderRadius: '1.5rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-color)',
                position: 'relative'
            }}>
                {/* Left Side - Login Form */}
                <div style={{
                    padding: '3.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `
              radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.1) 0%, transparent 50%)
            `,
                        zIndex: 0
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Header */}
                        <div style={{ marginBottom: '3rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    width: '4rem',
                                    height: '4rem',
                                    background: 'var(--gradient-primary)',
                                    borderRadius: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)'
                                }}>
                                    <ShoppingCart style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
                                </div>
                                <div>
                                    <h1 style={{
                                        fontSize: '2.5rem',
                                        fontWeight: '700',
                                        background: 'var(--gradient-primary)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        margin: 0
                                    }}>
                                        POS Pro
                                    </h1>
                                    <p style={{
                                        fontSize: '1rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: '0.25rem'
                                    }}>
                                        Point of Sale Management System
                                    </p>
                                </div>
                            </div>

                            <p style={{
                                fontSize: '1.125rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6
                            }}>
                                Secure login to access the comprehensive POS platform.
                                Manage sales, inventory, and transactions efficiently.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                background: 'var(--notification-error)',
                                border: '1px solid var(--danger-color)',
                                borderRadius: '1rem',
                                padding: '1.25rem',
                                marginBottom: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                animation: 'slide-in 0.3s ease-out'
                            }}>
                                <AlertCircle style={{
                                    width: '1.5rem',
                                    height: '1.5rem',
                                    color: 'var(--danger-color)',
                                    flexShrink: 0
                                }} />
                                <span style={{
                                    color: 'var(--danger-color)',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.5
                                }}>
                                    {error}
                                </span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '2rem',
                                marginBottom: '2rem'
                            }}>
                                {/* Username Field */}
                                <div>
                                    <label htmlFor="username" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <Users style={{ width: '1.25rem', height: '1.25rem' }} />
                                        Username
                                    </label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '1rem 1.25rem',
                                            borderRadius: '0.875rem',
                                            border: '1px solid var(--border-light)',
                                            background: 'var(--card-secondary-bg)',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                        placeholder="cashier"
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value);
                                            if (error) setError('');
                                        }}
                                        disabled={loading}
                                    />
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
                                        Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '1rem 1.25rem',
                                                paddingRight: '3.5rem',
                                                borderRadius: '0.875rem',
                                                border: '1px solid var(--border-light)',
                                                background: 'var(--card-secondary-bg)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (error) setError('');
                                            }}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '1rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                color: 'var(--text-tertiary)',
                                                padding: '0.5rem',
                                                opacity: loading ? 0.5 : 1,
                                                transition: 'color 0.2s'
                                            }}
                                            disabled={loading}
                                        >
                                            {showPassword ? (
                                                <EyeOff style={{ width: '1.5rem', height: '1.5rem' }} />
                                            ) : (
                                                <Eye style={{ width: '1.5rem', height: '1.5rem' }} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '1.25rem',
                                    border: 'none',
                                    borderRadius: '0.875rem',
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    background: loading
                                        ? 'var(--border-light)'
                                        : 'var(--gradient-primary)',
                                    color: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    boxShadow: loading
                                        ? 'none'
                                        : '0 10px 30px rgba(37, 99, 235, 0.3)'
                                }}
                                onMouseOver={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(37, 99, 235, 0.4)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(37, 99, 235, 0.3)';
                                    }
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div style={{
                                            width: '1.5rem',
                                            height: '1.5rem',
                                            border: '2px solid transparent',
                                            borderTop: '2px solid white',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <LogIn style={{ width: '1.5rem', height: '1.5rem' }} />
                                        Sign In to POS Dashboard
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Features Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1.5rem',
                            marginTop: '3rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid var(--border-light)'
                        }}>
                            {[
                                { icon: DollarSign, label: 'Sales Processing', desc: 'Quick checkout & payments' },
                                { icon: Package, label: 'Inventory', desc: 'Real-time stock tracking' },
                                { icon: BarChart, label: 'Reports', desc: 'Sales analytics & insights' }
                            ].map((feature, index) => (
                                <div key={index} style={{
                                    textAlign: 'center',
                                    padding: '1.5rem',
                                    background: 'rgba(37, 99, 235, 0.05)',
                                    borderRadius: '1rem',
                                    transition: 'all 0.3s'
                                }}>
                                    <div style={{
                                        width: '3.5rem',
                                        height: '3.5rem',
                                        background: 'var(--gradient-primary)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1rem auto',
                                        boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)'
                                    }}>
                                        <feature.icon style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} />
                                    </div>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {feature.label}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-tertiary)'
                                    }}>
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - App Info & Illustration */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--sidebar-bg) 0%, #1e3a8a 100%)',
                    padding: '3.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative Elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '300px',
                        height: '300px',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)',
                        borderRadius: '50%',
                        filter: 'blur(40px)'
                    }}></div>

                    <div style={{
                        position: 'absolute',
                        bottom: '-80px',
                        left: '-80px',
                        width: '250px',
                        height: '250px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                        borderRadius: '50%',
                        filter: 'blur(40px)'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* App Status */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '2rem',
                            marginBottom: '3rem',
                            width: 'fit-content',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <Clock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--success-color)' }} />
                            <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'white'
                            }}>
                                Electron Desktop App • Offline Mode Ready
                            </span>
                        </div>

                        {/* Main Illustration */}
                        <div style={{
                            marginBottom: '3rem',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '100%',
                                height: '200px',
                                background: `
                  linear-gradient(135deg, 
                    rgba(37, 99, 235, 0.2) 0%, 
                    rgba(5, 150, 105, 0.2) 50%, 
                    rgba(59, 130, 246, 0.2) 100%
                  )`,
                                borderRadius: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '2rem',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* POS Grid Illustration */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '8px',
                                    padding: '1rem'
                                }}>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} style={{
                                            width: '40px',
                                            height: '40px',
                                            background: i % 4 === 0
                                                ? 'rgba(16, 185, 129, 0.3)'
                                                : i === 5 || i === 6
                                                    ? 'var(--accent-blue)'
                                                    : 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            border: i === 5 ? '2px solid white' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {i === 5 && <DollarSign style={{ width: '20px', height: '20px', color: 'white' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                color: 'white',
                                marginBottom: '1rem'
                            }}>
                                Retail Management Solution
                            </h2>
                            <p style={{
                                fontSize: '1rem',
                                color: 'rgba(255, 255, 255, 0.8)',
                                lineHeight: 1.6
                            }}>
                                Streamline your retail operations with our comprehensive POS system.
                                Manage sales, inventory, and customer relationships efficiently.
                            </p>
                        </div>

                        {/* Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1.5rem',
                            marginTop: '2rem'
                        }}>
                            {[
                                { value: '99.9%', label: 'Uptime' },
                                { value: '10K+', label: 'Transactions' },
                                { value: '256-bit', label: 'Security' }
                            ].map((stat, index) => (
                                <div key={index} style={{
                                    textAlign: 'center',
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        color: 'white',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {stat.value}
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(255, 255, 255, 0.7)'
                                    }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Note */}
                        <div style={{
                            marginTop: '3rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            textAlign: 'center'
                        }}>
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255, 255, 255, 0.5)',
                                lineHeight: 1.5
                            }}>
                                POS Pro Desktop v3.0.0 • Optimized for Retail Stores •
                                Built with Electron & React
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        input:focus {
          outline: none;
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2) !important;
        }
        
        input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
        </div>
    );
};

export default POSLogin;