// ActivationDialog.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Key,
  Cpu,
  CloudOff,
  Copy,
  RefreshCw,
  Download,
  Upload,
  Lock,
  Unlock,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  HardDrive,
  Network,
  Server,
  FileKey,
  Clock,
  ArrowRight,
  LogOut
} from 'lucide-react';
import type { ActivationStatusData, DeviceInfoData } from '../../api/activation';
import activationAPI from '../../api/activation';
import { dialogs } from '../../utils/dialogs';


interface ActivationDialogProps {
  open: boolean;
  onClose: () => void;
  forceActivation?: boolean;
}

const ActivationDialog: React.FC<ActivationDialogProps> = ({
  open,
  onClose,
  forceActivation = false
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [activationKey, setActivationKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState<ActivationStatusData | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning' | '', text: string }>({ type: '', text: '' });

  useEffect(() => {
    if (open) {
      loadData();
    } else {
      // Reset form when closing
      setActivationKey('');
      setKeyError('');
      setMessage({ type: '', text: '' });
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Check activation status
      const statusResult = await activationAPI.check();
      if (statusResult.status) {
        setActivationStatus(statusResult.data);
      } else {
        console.error('Failed to get status:', statusResult.message);
        setActivationStatus(null);
      }

      // Get device info from API
      const deviceResult = await activationAPI.getDeviceInfo();
      if (deviceResult.status) {
        setDeviceInfo(deviceResult.data);
      } else {
        console.error('Failed to get device info:', deviceResult.message);
        setDeviceInfo(null);
      }

      // Check if activation is required
      const requirement = await activationAPI.requiresActivation();
      if (requirement.status) {
        const { requiresActivation, canContinue } = requirement.data;

        if (requiresActivation && !canContinue) {
          setMessage({
            type: 'warning',
            text: 'Activation is required to continue using the application.'
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to load activation data:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to load activation data'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateKeyFormat = (key: string): boolean => {
    // Clean the key and check format
    const cleanKey = key.replace(/-/g, '').toUpperCase();
    const pattern = /^[A-Z0-9]{16}$/;
    return pattern.test(cleanKey);
  };

  const handleActivationKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();

    // Allow only alphanumeric and dashes
    value = value.replace(/[^A-Z0-9-]/gi, '');

    // Auto-format with dashes
    if (value.length <= 16) {
      const clean = value.replace(/-/g, '');
      let formatted = '';
      for (let i = 0; i < clean.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formatted += '-';
        }
        formatted += clean[i];
      }
      value = formatted;
    }

    setActivationKey(value);

    if (value && !validateKeyFormat(value)) {
      setKeyError('Invalid format. Use: XXXX-XXXX-XXXX-XXXX');
    } else {
      setKeyError('');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();

      if (cleanText.length === 16) {
        // Format the key
        let formatted = '';
        for (let i = 0; i < cleanText.length; i++) {
          if (i > 0 && i % 4 === 0) {
            formatted += '-';
          }
          formatted += cleanText[i];
        }
        setActivationKey(formatted);
        setKeyError('');
      } else {
        setKeyError('Invalid key length. Must be 16 characters');
      }
    } catch (error) {
      console.error('Failed to paste:', error);
      setMessage({ type: 'error', text: 'Failed to paste from clipboard' });
    }
  };

  const activateOnline = async () => {
    if (!activationKey || keyError || isActivating) return;
    if (activationStatus?.status === "active") {
      await dialogs.info("This device is already activated.", "Already Activated")
      return;
    }
    const confirm = await dialogs.confirm({ title: "Confirmation", message: "Are you sure? do you want to request an activation?" })
    if (!confirm) return;

    setIsActivating(true);
    setMessage({ type: '', text: '' });

    try {
      // Gamitin ang bagong method na validateAndActivate
      const response = await activationAPI.validateAndActivate(activationKey);

      if (response.status) {
        setMessage({
          type: 'success',
          text: response.message || 'Activation successful!'
        });
        await dialogs.success("Activation successful!")

        // await loadData();
        handleExit();
        window.location.reload();
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Activation failed'
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Activation failed. Please try again.'
      });
    } finally {
      setIsActivating(false);
    }
  };

  const generateRequestFile = async () => {
    try {
      const response = await activationAPI.generateRequestFile();
      if (response.status) {
        setMessage({
          type: 'success',
          text: `Request file created: ${response.data?.filePath || 'Desktop'}`
        });
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to generate request file'
      });
    }
  };

  const importResponseFile = async () => {
    try {
      const response = await activationAPI.importResponseFile();
      if (response.status) {
        setMessage({
          type: 'success',
          text: response.message || 'Response file imported successfully!'
        });
        await loadData();
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to import response file'
      });
    }
  };

  const deactivateDevice = async () => {
    const confirm = await dialogs.confirm({ message: 'Are you sure you want to deactivate this device? This action cannot be undone.', title: 'Are you sure?', icon: 'warning' })
    if (!confirm) return;

    try {
      const response = await activationAPI.deactivate();
      if (response.status) {
        setMessage({
          type: 'success',
          text: response.message || 'Device deactivated successfully'
        });
        await loadData();
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Deactivation failed'
      });
    }
  };

  const syncActivation = async () => {
    try {
      const response = await activationAPI.sync();
      if (response.status) {
        setMessage({
          type: 'success',
          text: response.message || 'Activation status synced successfully!'
        });
        await loadData();
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Sync failed'
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'info', text: 'Copied to clipboard!' });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
    }
  };

  const getStatusColor = () => {
    if (!activationStatus) return 'var(--text-secondary)';
    switch (activationStatus.status) {
      case 'active': return 'var(--accent-green)';
      case 'trial': return 'var(--accent-orange)';
      case 'expired': return 'var(--accent-red)';
      case 'grace_period': return 'var(--accent-yellow)';
      case 'inactive': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusBgColor = () => {
    if (!activationStatus) return 'var(--card-secondary-bg)';
    switch (activationStatus.status) {
      case 'active': return 'var(--accent-green-light)';
      case 'trial': return 'var(--accent-orange-light)';
      case 'expired': return 'var(--accent-red-light)';
      case 'grace_period': return 'var(--accent-yellow-light)';
      case 'inactive': return 'var(--card-secondary-bg)';
      default: return 'var(--card-secondary-bg)';
    }
  };

  const getStatusText = (): string => {
    if (!activationStatus) return 'Checking...';
    const status = activationStatus.status;
    const days = activationStatus.remainingDays;

    switch (status) {
      case 'trial': return `Trial (${days} days remaining)`;
      case 'active': return 'Activated';
      case 'expired': return 'Expired';
      case 'grace_period': return `Grace Period (${days} days)`;
      case 'inactive': return 'Inactive';
      default: return status;
    }
  };

  const handleExit = () => {
    // Check if we can exit based on activation status
    // if (forceActivation && activationStatus?.status === 'expired') {
    //   setMessage({
    //     type: 'error',
    //     text: 'Cannot exit. Activation is required to continue.'
    //   });
    //   return;
    // }

    // if (forceActivation && !activationStatus) {
    //   setMessage({
    //     type: 'warning',
    //     text: 'Please activate your license before exiting.'
    //   });
    //   return;
    // }

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="compact-card rounded-lg transition-all duration-300 ease-in-out max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-blue-dark)' }}>
              <Lock size={20} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sidebar-text)' }}>License Activation</h3>
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={12} />
                Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activationStatus && (
              <div
                className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2"
                style={{
                  background: getStatusBgColor(),
                  color: getStatusColor(),
                  border: `1px solid ${getStatusColor()}20`
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: getStatusColor() }}></div>
                {getStatusText()}
              </div>
            )}

            {/* Exit Button */}
            {!forceActivation && (
              <button
                onClick={handleExit}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: 'var(--accent-red-light)',
                  color: 'var(--accent-red)',
                  border: '1px solid var(--accent-red)'
                }}
              >
                <LogOut size={16} />
                Exit
              </button>
            )}

            <button
              onClick={handleExit}
              className="p-1.5 hover:bg-[var(--card-hover-bg)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={forceActivation && activationStatus?.status === 'expired'}
            >
              <X size={20} style={{ color: 'var(--sidebar-text)' }} />
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`m-4 p-3 rounded-lg flex items-center gap-2 animate-fadeIn ${message.type === 'success' ? 'bg-[var(--accent-green-light)] border border-[var(--accent-green)] text-[var(--accent-green)]' :
              message.type === 'error' ? 'bg-[var(--accent-red-light)] border border-[var(--accent-red)] text-[var(--accent-red)]' :
                message.type === 'warning' ? 'bg-[var(--accent-orange-light)] border border-[var(--accent-orange)] text-[var(--accent-orange)]' :
                  message.type === 'info' ? 'bg-[var(--accent-blue-light)] border border-[var(--accent-blue)] text-[var(--accent-blue)]' :
                    'bg-[var(--card-secondary-bg)] text-[var(--sidebar-text)]'
              }`}
          >
            {message.type === 'success' && <CheckCircle size={18} />}
            {message.type === 'error' && <AlertCircle size={18} />}
            {message.type === 'warning' && <AlertCircle size={18} />}
            {message.type === 'info' && <CheckCircle size={18} />}
            <span className="text-sm flex-1">{message.text}</span>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="ml-auto opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4 transition-colors duration-300"
              style={{ borderColor: 'var(--primary-color)' }}></div>
            <p className="text-sm transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>
              Loading activation data...
            </p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
              {[
                { id: 0, label: 'Online Activation', icon: Key, color: 'var(--accent-blue)' },
                // { id: 1, label: 'Offline Activation', icon: CloudOff, color: 'var(--accent-orange)' },
                { id: 2, label: 'Device Info', icon: Cpu, color: 'var(--accent-purple)' }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${activeTab === tab.id
                      ? 'border-b-2'
                      : 'hover:bg-[var(--card-secondary-bg)] opacity-70 hover:opacity-100'
                      }`}
                    style={{
                      color: activeTab === tab.id ? tab.color : 'var(--text-secondary)',
                      borderColor: activeTab === tab.id ? tab.color : 'transparent'
                    }}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 0 && (
                <div className="space-y-6">
                  <div className="compact-card rounded-lg p-4" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Key size={18} style={{ color: 'var(--accent-blue)' }} />
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--sidebar-text)' }}>ENTER ACTIVATION KEY</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={activationKey}
                              onChange={handleActivationKeyChange}
                              placeholder="XXXX-XXXX-XXXX-XXXX"
                              className="w-full compact-input rounded-md text-sm px-4 py-3"
                              style={{
                                background: 'var(--input-bg)',
                                color: 'var(--input-text)',
                                border: keyError ? '1px solid var(--accent-red)' : '1px solid var(--input-border)',
                                fontFamily: 'monospace',
                                letterSpacing: '1px',
                                fontSize: '16px'
                              }}
                              maxLength={19}
                            />
                            {keyError && (
                              <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--accent-red)' }}>
                                <AlertCircle size={12} />
                                {keyError}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={handlePasteFromClipboard}
                            className="compact-button btn-secondary whitespace-nowrap"
                            style={{ minWidth: '80px' }}
                          >
                            <Copy size={14} />
                            Paste
                          </button>
                        </div>

                        {activationKey && !keyError && (
                          <div className="p-4 rounded-md flex justify-center gap-2"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            {activationKey.split('-').map((part, idx) => (
                              <div key={idx} className="flex items-center">
                                <div
                                  className="px-3 py-2 rounded text-base font-mono font-bold"
                                  style={{
                                    background: 'var(--card-secondary-bg)',
                                    color: 'var(--sidebar-text)',
                                    minWidth: '70px',
                                    textAlign: 'center'
                                  }}
                                >
                                  {part}
                                </div>
                                {idx < 3 && (
                                  <span className="mx-2" style={{ color: 'var(--text-secondary)' }}>-</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <p>• Enter your 16-character activation key (letters and numbers only)</p>
                        <p>• Format will be applied automatically</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    {/* <button
                      onClick={syncActivation}
                      className="compact-button btn-secondary flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      Sync Status
                    </button> */}

                    <div className="flex gap-3">
                      <button
                        onClick={loadData}
                        className="compact-button btn-secondary"
                      >
                        Refresh
                      </button>

                      <button
                        onClick={activateOnline}
                        disabled={!activationKey || !!keyError || isActivating}
                        className="compact-button btn-primary flex items-center gap-2 min-w-[120px] justify-center"
                      >
                        {isActivating ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <ArrowRight size={14} />
                            Activate Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CloudOff size={20} style={{ color: 'var(--accent-orange)' }} />
                      <h4 className="text-base font-semibold" style={{ color: 'var(--sidebar-text)' }}>Offline Activation Process</h4>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      For environments without internet access, generate an activation request file and send it to your vendor.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="compact-card rounded-lg p-4" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: 'var(--accent-orange-dark)' }}>
                          <Download size={18} style={{ color: 'var(--accent-orange)' }} />
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold" style={{ color: 'var(--sidebar-text)' }}>Step 1: Generate Request</h5>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Create activation request file</p>
                        </div>
                      </div>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                        This file contains your encrypted device information for offline activation.
                      </p>
                      <button
                        onClick={generateRequestFile}
                        className="compact-button btn-secondary w-full"
                      >
                        <Download size={14} />
                        Generate Request File
                      </button>
                    </div>

                    <div className="compact-card rounded-lg p-4" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: 'var(--accent-green-dark)' }}>
                          <Upload size={18} style={{ color: 'var(--accent-green)' }} />
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold" style={{ color: 'var(--sidebar-text)' }}>Step 2: Import Response</h5>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Import vendor's response file</p>
                        </div>
                      </div>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                        After receiving the response file from your vendor, import it to complete activation.
                      </p>
                      <button
                        onClick={importResponseFile}
                        className="compact-button btn-secondary w-full"
                      >
                        <Upload size={14} />
                        Import Response File
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && deviceInfo && (
                <div className="space-y-6">
                  <div className="compact-card rounded-lg p-4" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg" style={{ background: 'var(--accent-purple-dark)' }}>
                        <Server size={18} style={{ color: 'var(--accent-purple)' }} />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold" style={{ color: 'var(--sidebar-text)' }}>Device Information</h4>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Unique identifiers for this device</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'Device ID', value: deviceInfo.deviceId, icon: HardDrive, color: 'var(--accent-blue)' },
                        { label: 'Device Name', value: deviceInfo.deviceName, icon: Cpu, color: 'var(--accent-green)' },
                        { label: 'Platform', value: deviceInfo.platform, icon: Shield, color: 'var(--accent-purple)' },
                        { label: 'Architecture', value: deviceInfo.arch, icon: Cpu, color: 'var(--accent-indigo)' },
                        { label: 'Hostname', value: deviceInfo.hostname, icon: Network, color: 'var(--accent-orange)' },
                        { label: 'MAC Address', value: deviceInfo.macAddress, icon: Network, color: 'var(--accent-emerald)' },
                        { label: 'Serial Number', value: deviceInfo.serialNumber || 'Not available', icon: FileKey, color: 'var(--accent-green)' },
                        { label: 'CPU ID', value: deviceInfo.cpuId || 'Not available', icon: Cpu, color: 'var(--accent-blue)' },
                      ].map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={index}
                            className="p-3 rounded-lg transition-all duration-200 ease-in-out hover:bg-[var(--card-hover-bg)] group"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon size={14} style={{ color: item.color }} />
                              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-mono truncate flex-1 mr-2" style={{ color: 'var(--sidebar-text)' }}>
                                {item.value}
                              </span>
                              <button
                                onClick={() => copyToClipboard(item.value)}
                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--card-secondary-bg)] rounded-md transition-all"
                                title="Copy to clipboard"
                              >
                                <Copy size={14} style={{ color: 'var(--text-secondary)' }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={loadData}
                      className="compact-button btn-secondary flex-1"
                    >
                      <RefreshCw size={14} />
                      Refresh Info
                    </button>
                    <button
                      onClick={deactivateDevice}
                      className="compact-button btn-danger flex-1"
                    >
                      <Unlock size={14} />
                      Deactivate Device
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center">
                <div className="text-xs flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
                  {activationStatus && (
                    <>
                      <span className="flex items-center gap-1">
                        Status: <span style={{ color: getStatusColor() }}>{getStatusText()}</span>
                      </span>
                      {activationStatus.activatedAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Activated: {new Date(activationStatus.activatedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      {activationStatus.expiresAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Expires: {new Date(activationStatus.expiresAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      {activationStatus.remainingDays > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Days Left: {activationStatus.remainingDays}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {!forceActivation && (
                    <button
                      onClick={handleExit}
                      className="compact-button btn-secondary"
                      disabled={activationStatus?.status === 'expired'}
                    >
                      {activationStatus?.status === 'expired' ? 'Activation Required' : 'Close Dialog'}
                    </button>
                  )}
                  <button
                    onClick={() => window.open('https://activation-center-server.vercel.app/', '_blank')}
                    className="compact-button btn-primary"
                  >
                    Get License Key
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivationDialog;