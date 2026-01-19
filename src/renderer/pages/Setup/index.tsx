// File: src/pages/setup/FirstRunSetup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  Building,
  Key,
  AlertCircle,
  X,
  ArrowLeft,
  HelpCircle,
  Settings,
  CreditCard,
  Package,
  Users,
  BarChart3
} from 'lucide-react';
import userAPI from '../../api/user';
import windowControlAPI from '../../api/control'; // Updated import
import { posAuthStore } from '../../lib/authStore';

// Removed the global window.electron declaration since we're using windowControlAPI

const FirstRunSetup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Form fields
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeId, setEmployeeId] = useState('EMP001');

  const navigate = useNavigate();

  // Check if setup is required
  useEffect(() => {
    checkSetupRequired();
    setupWindowControls();
  }, []);

  const setupWindowControls = async () => {
    try {
      // Check initial window state
      const maximized = await windowControlAPI.isMaximized();
      setIsMaximized(maximized);
      
      // Set up event listeners for window state changes
      windowControlAPI.onWindowMaximized(() => setIsMaximized(true));
      windowControlAPI.onWindowRestored(() => setIsMaximized(false));
    } catch (error) {
      console.error('Error setting up window controls:', error);
    }
  };

  const checkSetupRequired = async () => {
    try {
      const response = await userAPI.getAllUsers();
      const hasUsers = response.data && response.data.length > 0;
      setSetupRequired(!hasUsers);
    } catch (error) {
      console.error('Error checking setup:', error);
      setSetupRequired(true);
    } finally {
      setCheckingSetup(false);
    }
  };

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      setError('Password is required');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (step === 1) {
        // Check if default admin exists, create if not
        const usersResponse = await userAPI.getAllUsers();
        const hasAdmin = usersResponse.data?.some(user => 
          user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'administrator'
        );

        if (!hasAdmin) {
          setSuccess('System prepared for initial setup');
          setStep(2);
        } else {
          setStep(2);
        }
        setLoading(false);
        return;
      }

      if (step === 2) {
        // Create admin user with full permissions
        const createUserResponse = await userAPI.createUser({
          username: username.trim(),
          password: password.trim(),
          role: 'Administrator',
          first_name: firstName.trim() || 'System',
          last_name: lastName.trim() || 'Administrator',
          email: email.trim() || undefined,
          employee_id: employeeId.trim(),
          department: 'Management',
          can_manage_products: true,
          can_adjust_inventory: true,
          can_view_reports: true
        });

        if (createUserResponse.status && createUserResponse.data) {
          // Auto-login the created user
          const loginResponse = await userAPI.login(username.trim(), password.trim());
          
          if (loginResponse.success && loginResponse.user) {
            // Set auth data in POS auth store
            const userData = loginResponse.user;
            
            posAuthStore.setAuthData({
              user: {
                ...userData,
                permissions: [
                  'can_view_dashboard',
                  'can_manage_users',
                  'can_manage_products',
                  'can_manage_inventory',
                  'can_view_reports',
                  'can_process_sales',
                  'can_manage_customers',
                  'can_manage_suppliers',
                  'can_adjust_prices',
                  'can_view_audit_logs'
                ]
              },
              token: 'pos-admin-token-' + Date.now(), // Generate initial token
              expiresIn: 24 * 60 * 60 // 24 hours
            });

            setSuccess('Setup completed successfully! Redirecting to dashboard...');
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            // Even if auto-login fails, setup is complete
            setSuccess('Admin account created! Redirecting to login...');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Setup failed. Please try again.');
      console.error('Setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    try {
      await windowControlAPI.close();
    } catch (error) {
      console.error('Error closing window:', error);
      window.close();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      setSuccess('');
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background-color)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary-color)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Checking system setup...</p>
        </div>
      </div>
    );
  }

  if (!setupRequired) {
    navigate('/login');
    return null;
  }

  const steps = [
    {
      number: 1,
      title: 'System Preparation',
      description: 'Prepare POS system',
      icon: Settings
    },
    {
      number: 2,
      title: 'Admin Account',
      description: 'Create administrator account',
      icon: UserPlus
    }
  ];

  return (
    <div className="h-screen" style={{ background: 'var(--background-color)' }}>
      {/* Windows-style Top Bar */}
      <div style={{
        height: '36px',
        background: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--topbar-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '22px',
            height: '22px',
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CreditCard style={{ width: '14px', height: '14px', color: 'white' }} />
          </div>
          <span style={{
            color: 'var(--sidebar-text)',
            fontWeight: '500',
            fontSize: '13px'
          }}>
            POS Management - First Run Setup
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => windowControlAPI.minimize()}
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--topbar-hover)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <div style={{ width: '10px', height: '2px', background: 'currentColor' }}></div>
          </button>

          <button
            onClick={() => windowControlAPI.toggleMaximize()}
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--topbar-hover)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {isMaximized ? (
              <div style={{
                width: '8px',
                height: '8px',
                position: 'relative'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  border: '1.5px solid currentColor',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}></div>
                <div style={{
                  width: '6px',
                  height: '6px',
                  border: '1.5px solid currentColor',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  borderTopColor: 'transparent',
                  borderLeftColor: 'transparent'
                }}></div>
              </div>
            ) : (
              <div style={{
                width: '10px',
                height: '10px',
                border: '1.5px solid currentColor',
                borderRadius: '1px'
              }}></div>
            )}
          </button>

          <button
            onClick={() => setShowExitConfirm(true)}
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger-color)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--danger-color)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--danger-color)';
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Main Content - Fixed Height */}
      <div style={{
        height: 'calc(100vh - 36px)',
        display: 'flex',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Setup Header - Compact */}
          <div style={{
            padding: '24px 32px',
            background: 'linear-gradient(135deg, var(--sidebar-bg) 0%, #1e3a8a 100%)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px' 
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.5)'
              }}>
                <CreditCard style={{ 
                  width: '32px', 
                  height: '32px', 
                  color: 'white' 
                }} />
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '6px'
                }}>
                  Welcome to POS Management System
                </h1>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  lineHeight: 1.5
                }}>
                  Let's get your POS system set up. This one-time process will configure your point-of-sale management platform.
                </p>
              </div>
            </div>
          </div>

          {/* Content Area - Fixed Height */}
          <div style={{
            display: 'flex',
            flex: 1,
            minHeight: 0
          }}>
            {/* Sidebar Navigation */}
            <div style={{
              background: 'var(--card-secondary-bg)',
              padding: '20px',
              borderRight: '1px solid var(--border-color)',
              minWidth: '220px',
              flexShrink: 0
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>
                  Setup Progress
                </h3>

                <div style={{ display: 'grid', gap: '8px' }}>
                  {steps.map((stepItem) => (
                    <button
                      key={stepItem.number}
                      onClick={() => {
                        if (stepItem.number < step) setStep(stepItem.number);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px',
                        background: step === stepItem.number 
                          ? 'var(--card-hover-bg)' 
                          : step > stepItem.number
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'transparent',
                        border: step === stepItem.number 
                          ? '1px solid var(--primary-color)'
                          : '1px solid transparent',
                        borderRadius: '8px',
                        cursor: stepItem.number <= step ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: step === stepItem.number 
                          ? 'var(--primary-color)'
                          : step > stepItem.number
                          ? 'var(--success-color)'
                          : 'var(--card-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {step > stepItem.number ? (
                          <CheckCircle style={{ 
                            width: '16px', 
                            height: '16px', 
                            color: 'white' 
                          }} />
                        ) : (
                          <stepItem.icon style={{ 
                            width: '16px', 
                            height: '16px', 
                            color: step === stepItem.number ? 'white' : 'var(--text-secondary)' 
                          }} />
                        )}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: step === stepItem.number 
                            ? 'var(--text-primary)' 
                            : step > stepItem.number
                            ? 'var(--success-color)'
                            : 'var(--text-secondary)',
                          marginBottom: '2px'
                        }}>
                          {stepItem.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: step === stepItem.number 
                            ? 'var(--text-secondary)' 
                            : step > stepItem.number
                            ? 'var(--success-color)'
                            : 'var(--text-tertiary)'
                        }}>
                          {stepItem.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Help Section */}
              <div style={{
                paddingTop: '20px',
                borderTop: '1px solid var(--border-light)'
              }}>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <HelpCircle style={{ width: '14px', height: '14px' }} />
                  Need Help?
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  lineHeight: 1.5,
                  marginBottom: '12px'
                }}>
                  Contact support if you encounter issues.
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{
              padding: '24px',
              background: 'var(--card-bg)',
              flex: 1,
              overflow: 'auto'
            }}>
              {/* Navigation Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  {step > 1 && (
                    <button
                      onClick={handleBack}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'var(--card-secondary-bg)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ArrowLeft style={{ width: '14px', height: '14px' }} />
                      Back
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowExitConfirm(true)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--danger-color)',
                    borderRadius: '6px',
                    color: 'var(--danger-color)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Exit Setup
                </button>
              </div>

              {/* Error/Success Messages */}
              {(error || success) && (
                <div style={{
                  marginBottom: '20px',
                  animation: 'slide-in 0.3s ease-out'
                }}>
                  {error && (
                    <div style={{
                      background: 'var(--notification-error)',
                      border: '1px solid var(--danger-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <AlertCircle style={{ 
                        width: '20px', 
                        height: '20px', 
                        color: 'var(--danger-color)',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--danger-color)',
                          marginBottom: '2px',
                          fontSize: '13px'
                        }}>
                          Setup Error
                        </div>
                        <div style={{ 
                          color: 'var(--danger-color)', 
                          fontSize: '12px',
                          lineHeight: 1.4
                        }}>
                          {error}
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div style={{
                      background: 'var(--notification-success)',
                      border: '1px solid var(--success-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <CheckCircle style={{ 
                        width: '20px', 
                        height: '20px', 
                        color: 'var(--success-color)',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--success-color)',
                          marginBottom: '2px',
                          fontSize: '13px'
                        }}>
                          Success
                        </div>
                        <div style={{ 
                          color: 'var(--success-color)', 
                          fontSize: '12px',
                          lineHeight: 1.4
                        }}>
                          {success}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: System Preparation */}
              {step === 1 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      System Preparation
                    </h2>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      lineHeight: 1.5
                    }}>
                      We'll prepare your POS system for initial use. This includes setting up the admin account and default permissions.
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    {/* POS Features Card */}
                    <div style={{
                      background: 'var(--card-secondary-bg)',
                      borderRadius: '10px',
                      padding: '20px',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'var(--primary-color)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Shield style={{ 
                            width: '20px', 
                            height: '20px', 
                            color: 'white' 
                          }} />
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '2px'
                          }}>
                            System Features
                          </h3>
                          <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '12px'
                          }}>
                            Full POS capabilities will be enabled
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        {[
                          { name: 'Sales Processing', icon: CreditCard, color: 'var(--accent-blue)', desc: 'Process transactions and payments' },
                          { name: 'Inventory Management', icon: Package, color: 'var(--accent-green)', desc: 'Track and manage stock levels' },
                          { name: 'Customer Management', icon: Users, color: 'var(--accent-purple)', desc: 'Manage customer information' },
                          { name: 'Reports & Analytics', icon: BarChart3, color: 'var(--accent-amber)', desc: 'Generate sales reports' }
                        ].map((feature, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            background: 'var(--card-bg)',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              background: feature.color,
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <feature.icon style={{ 
                                width: '16px', 
                                height: '16px', 
                                color: 'white' 
                              }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginBottom: '2px'
                              }}>
                                {feature.name}
                              </div>
                              <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: '11px'
                              }}>
                                {feature.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Continue Button for Step 1 */}
                  <button
                    onClick={() => {
                      setStep(2);
                      setError('');
                      setSuccess('');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    Continue to Account Setup
                  </button>
                </div>
              )}

              {/* Step 2: Admin Account Form */}
              {step === 2 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Create Administrator Account
                    </h2>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      lineHeight: 1.5
                    }}>
                      Create your first administrator account with full system access to manage your POS.
                    </p>
                  </div>

                  <div style={{ maxWidth: '100%' }}>
                    <form onSubmit={handleSubmit}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                      }}>
                        {/* Username */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Username
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                              placeholder="admin"
                              required
                            />
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}>
                              <UserPlus style={{ width: '16px', height: '16px' }} />
                            </div>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            This will be your login username
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Email Address (Optional)
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                              placeholder="admin@company.com"
                            />
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}>
                              <Mail style={{ width: '16px', height: '16px' }} />
                            </div>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            Used for account recovery
                          </div>
                        </div>

                        {/* First Name */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            First Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)',
                              background: 'var(--card-secondary-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }}
                            placeholder="First name"
                          />
                        </div>

                        {/* Last Name */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Last Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)',
                              background: 'var(--card-secondary-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }}
                            placeholder="Last name"
                          />
                        </div>

                        {/* Employee ID */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Employee ID
                          </label>
                          <input
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)',
                              background: 'var(--card-secondary-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }}
                            placeholder="EMP001"
                          />
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            Unique identifier for POS operations
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                              placeholder="••••••••"
                              required
                            />
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}>
                              <Lock style={{ width: '16px', height: '16px' }} />
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                                padding: '2px'
                              }}
                            >
                              {showPassword ? (
                                <EyeOff style={{ width: '16px', height: '16px' }} />
                              ) : (
                                <Eye style={{ width: '16px', height: '16px' }} />
                              )}
                            </button>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            Minimum 8 characters
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Confirm Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                              placeholder="••••••••"
                              required
                            />
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}>
                              <Lock style={{ width: '16px', height: '16px' }} />
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                                padding: '2px'
                              }}
                            >
                              {showConfirmPassword ? (
                                <EyeOff style={{ width: '16px', height: '16px' }} />
                              ) : (
                                <Eye style={{ width: '16px', height: '16px' }} />
                              )}
                            </button>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            Must match password
                          </div>
                        </div>
                      </div>

                      {/* Permissions Summary */}
                      <div style={{
                        background: 'var(--card-secondary-bg)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px',
                        border: '1px solid var(--border-light)'
                      }}>
                        <h3 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Shield style={{ width: '16px', height: '16px', color: 'var(--primary-color)' }} />
                          Administrator Permissions
                        </h3>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '8px'
                        }}>
                          {[
                            'Manage all users and roles',
                            'Process sales and transactions',
                            'Manage products and inventory',
                            'View reports and analytics',
                            'Manage customers and suppliers',
                            'Adjust prices and discounts',
                            'View audit logs',
                            'System configuration'
                          ].map((permission, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12px',
                              color: 'var(--text-secondary)'
                            }}>
                              <CheckCircle style={{ width: '14px', height: '14px', color: 'var(--success-color)' }} />
                              {permission}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          background: loading 
                            ? 'var(--border-light)' 
                            : 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                          color: 'white',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px'
                        }}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <Key style={{ width: '16px', height: '16px' }} />
                            Complete Setup & Login
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 24px',
            background: 'var(--card-secondary-bg)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)'
              }}>
                POS Management • Windows Desktop App
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px'
            }}>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)'
              }}>
                Step {step} of {steps.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '10px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid var(--border-color)',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--notification-error)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                border: '1px solid var(--danger-color)'
              }}>
                <AlertCircle style={{ 
                  width: '24px', 
                  height: '24px', 
                  color: 'var(--danger-color)' 
                }} />
              </div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '10px'
              }}>
                Exit Setup?
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                fontSize: '13px',
                marginBottom: '4px'
              }}>
                The POS Management system <strong>cannot be used</strong> without completing this setup.
              </p>
              <p style={{
                color: 'var(--text-tertiary)',
                fontSize: '12px',
                lineHeight: 1.5
              }}>
                If you exit now, you'll need to restart the application to complete setup.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--card-secondary-bg)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flex: 1
                }}
              >
                Continue Setup
              </button>
              <button
                onClick={handleExit}
                style={{
                  padding: '10px 20px',
                  background: 'var(--danger-color)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flex: 1
                }}
              >
                Exit Application
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slide-in {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        input:focus {
          outline: none;
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
        }
        
        button:disabled {
          cursor: not-allowed !important;
          opacity: 0.6 !important;
        }
      `}</style>
    </div>
  );
};

export default FirstRunSetup;