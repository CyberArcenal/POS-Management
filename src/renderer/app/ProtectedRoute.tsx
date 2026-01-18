import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import ActivationDialog from '../components/activations/ActivationDialog';
import activationAPI from '../api/activation';
import { posAuthStore } from '../lib/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  requiredModule?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission, 
  requiredRole,
  requiredModule 
}) => {
  const [isActivationRequired, setIsActivationRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkActivation = async () => {
      try {
        const response = await activationAPI.requiresActivation();
        if (response.data?.requiresActivation && !response.data?.canContinue) {
          setIsActivationRequired(true);
          setShowDialog(true);
        }
      } catch (error) {
        console.error('Failed to check activation:', error);
      } finally {
        setLoading(false);
      }
    };

    checkActivation();
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = posAuthStore.isAuthenticated();

      if (!isAuthenticated) {
        setIsAuthorized(false);
        return;
      }

      // Check module access if required
      if (requiredModule) {
        const canAccessModule = posAuthStore.canAccessModule(requiredModule);
        if (!canAccessModule) {
          setIsAuthorized(false);
          return;
        }
      }

      // Check role if required
      if (requiredRole) {
        const userRole = posAuthStore.getRole();
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const hasRequiredRole = requiredRoles.some(role => 
          userRole.toLowerCase() === role.toLowerCase()
        );
        
        if (!hasRequiredRole && !posAuthStore.isAdmin()) {
          setIsAuthorized(false);
          return;
        }
      }

      // Check permission if required
      if (requiredPermission) {
        const hasPermission = posAuthStore.hasPermission(requiredPermission);
        if (!hasPermission && !posAuthStore.isAdmin()) {
          setIsAuthorized(false);
          return;
        }
      }

      setIsAuthorized(true);
    };

    checkAuth();
  }, [requiredPermission, requiredRole, requiredModule]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background-color)'
      }}>
        <div className="text-center">
          <div style={{
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            width: '3rem',
            height: '3rem',
            border: '3px solid transparent',
            borderTop: '3px solid var(--primary-color)',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading POS System...</p>
        </div>
      </div>
    );
  }

  if (isActivationRequired) {
    return (
      <>
        <ActivationDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          forceActivation={true}
        />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--background-color)',
          padding: '1rem'
        }}>
          <div className="text-center">
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'var(--gradient-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>POS</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              License Activation Required
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
              Please activate your license to continue using the POS Management System.
              You can still use basic features for a limited time.
            </p>
            <button
              onClick={() => setShowDialog(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }}
            >
              Activate POS License
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthorized) {
    // Get user info for better error message
    const userInfo = posAuthStore.getUserDisplayInfo();
    const isAuthenticated = posAuthStore.isAuthenticated();

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    // Show unauthorized page if authenticated but not authorized
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background-color)',
        padding: '1rem'
      }}>
        <div className="text-center" style={{ maxWidth: '500px' }}>
          <div style={{
            width: '5rem',
            height: '5rem',
            background: 'var(--notification-error)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            border: '2px solid var(--danger-color)'
          }}>
            <span style={{ color: 'var(--danger-color)', fontSize: '2rem', fontWeight: 'bold' }}>!</span>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Access Denied
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            You don't have permission to access this page.
            {userInfo && (
              <>
                <br />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Logged in as: {userInfo.name} ({userInfo.role})
                </span>
              </>
            )}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.hash = '/pos/dashboard'}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render children (which includes the Layout component and its nested routes)
  return <>{children}</>;
};

// POS-specific route protection hooks
export const usePOSAuth = () => {
  const checkPermission = (permission: string): boolean => {
    return posAuthStore.hasPermission(permission) || posAuthStore.isAdmin();
  };

  const checkRole = (role: string | string[]): boolean => {
    const userRole = posAuthStore.getRole();
    const requiredRoles = Array.isArray(role) ? role : [role];
    
    if (posAuthStore.isAdmin()) return true;
    
    return requiredRoles.some(reqRole => 
      userRole.toLowerCase() === reqRole.toLowerCase()
    );
  };

  const checkModuleAccess = (module: string): boolean => {
    return posAuthStore.canAccessModule(module);
  };

  return {
    isAuthenticated: posAuthStore.isAuthenticated(),
    user: posAuthStore.getUserDisplayInfo(),
    permissions: posAuthStore.getDashboardPermissions(),
    checkPermission,
    checkRole,
    checkModuleAccess,
    logout: () => posAuthStore.logout()
  };
};

export default ProtectedRoute;