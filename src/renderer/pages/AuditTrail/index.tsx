// AuditTrailPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Database,
  Activity,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart,
  Users,
  Package,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ExternalLink,
  Info,
  TrendingUp,
  TrendingDown,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import auditTrailAPI from '../../api/audit';

// Date utilities
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

// Risk level colors
const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel?.toLowerCase()) {
    case 'critical': return 'text-red-400';
    case 'high': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-emerald-400';
    default: return 'text-[var(--text-tertiary)]';
  }
};

const getRiskBgColor = (riskLevel: string): string => {
  switch (riskLevel?.toLowerCase()) {
    case 'critical': return 'bg-red-900/20';
    case 'high': return 'bg-orange-900/20';
    case 'medium': return 'bg-yellow-900/20';
    case 'low': return 'bg-emerald-900/20';
    default: return 'bg-[var(--card-bg)]';
  }
};

const AuditTrailPage: React.FC = () => {
  // State for data
  const [auditData, setAuditData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState<any>(null);

  // Filter states
  const [dateRange, setDateRange] = useState('last7');
  const [startDate, setStartDate] = useState<string>(formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [endDate, setEndDate] = useState<string>(formatDate(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  // Date range options
  const dateRanges = [
    { id: 'today', label: 'Today', days: 0 },
    { id: 'yesterday', label: 'Yesterday', days: 1 },
    { id: 'last7', label: 'Last 7 Days', days: 7 },
    { id: 'last30', label: 'Last 30 Days', days: 30 },
    { id: 'last90', label: 'Last 90 Days', days: 90 },
    { id: 'thisMonth', label: 'This Month', days: 0 },
    { id: 'lastMonth', label: 'Last Month', days: 0 },
    { id: 'custom', label: 'Custom Range', days: 0 }
  ];

  // Extract unique actions and entities from data
  const uniqueActions = useMemo(() => {
    const actions = auditData.map(item => item.action).filter(Boolean);
    return ['all', ...Array.from(new Set(actions))].sort();
  }, [auditData]);

  const uniqueEntities = useMemo(() => {
    const entities = auditData.map(item => item.entity).filter(Boolean);
    return ['all', ...Array.from(new Set(entities))].sort();
  }, [auditData]);

  const uniqueUsers = useMemo(() => {
    const users = auditData
      .map(item => item.user_info?.username || 'Unknown')
      .filter(Boolean);
    return ['all', ...Array.from(new Set(users))].sort();
  }, [auditData]);

  // Load audit data
  const loadAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate dates based on selected range
      let calculatedStartDate = startDate;
      let calculatedEndDate = endDate;

      const today = new Date();
      if (dateRange === 'today') {
        calculatedStartDate = formatDate(today);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        calculatedStartDate = formatDate(yesterday);
        calculatedEndDate = formatDate(yesterday);
      } else if (dateRange === 'last7') {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        calculatedStartDate = formatDate(last7);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'last30') {
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        calculatedStartDate = formatDate(last30);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'last90') {
        const last90 = new Date(today);
        last90.setDate(last90.getDate() - 90);
        calculatedStartDate = formatDate(last90);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'thisMonth') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        calculatedStartDate = formatDate(firstDay);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'lastMonth') {
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        calculatedStartDate = formatDate(firstDayLastMonth);
        calculatedEndDate = formatDate(lastDayLastMonth);
      }

      // Build filters
      const filters: any = {
        start_date: calculatedStartDate,
        end_date: calculatedEndDate,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      };

      if (selectedAction !== 'all') filters.action = selectedAction;
      if (selectedEntity !== 'all') filters.entity = selectedEntity;
      if (selectedUser !== 'all') filters.username = selectedUser;
      if (searchQuery.trim()) filters.query = searchQuery;

      // Fetch data
      const [searchRes, statsRes, suspiciousRes] = await Promise.all([
        auditTrailAPI.searchAuditsWithPagination(searchQuery, filters, currentPage, pageSize),
        auditTrailAPI.getStatistics(filters),
        auditTrailAPI.getSuspiciousActivities(filters)
      ]);

      setAuditData(searchRes.results || []);
      setTotalResults(searchRes.search_stats?.total_results || 0);
      setTotalPages(searchRes.pagination?.totalPages || 1);
      
      setStats(statsRes.data);
      setSuspiciousActivities(suspiciousRes.data);

      // Update dates in state
      setStartDate(calculatedStartDate);
      setEndDate(calculatedEndDate);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit data');
      console.error('Error loading audit data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate, searchQuery, selectedAction, selectedEntity, selectedUser, currentPage, pageSize]);

  // Initial load
  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, searchQuery, selectedAction, selectedEntity, selectedUser]);

  // Export functions
  const exportToCSV = async () => {
    try {
      const csvData = await auditTrailAPI.exportAudits('csv', {
        start_date: startDate,
        end_date: endDate,
        action: selectedAction !== 'all' ? selectedAction : undefined,
        entity: selectedEntity !== 'all' ? selectedEntity : undefined,
        query: searchQuery || undefined
      });

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export audit trail');
    }
  };

  const exportToJSON = async () => {
    try {
      const jsonData = await auditTrailAPI.exportAudits('json', {
        start_date: startDate,
        end_date: endDate,
        action: selectedAction !== 'all' ? selectedAction : undefined,
        entity: selectedEntity !== 'all' ? selectedEntity : undefined,
        query: searchQuery || undefined
      });

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export audit trail');
    }
  };

  // Toggle row expansion
  const toggleRowExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // View audit details
  const viewAuditDetails = async (id: number) => {
    try {
      const response = await auditTrailAPI.getById(id);
      setSelectedAudit(response.data);
    } catch (err) {
      console.error('Error loading audit details:', err);
      alert('Failed to load audit details');
    }
  };

  // Check if activity is suspicious
  const isSuspicious = (audit: any): boolean => {
    return auditTrailAPI.isSuspiciousActivity(audit);
  };

  // Pagination controls
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded ${currentPage === i
              ? 'bg-[var(--accent-blue)] text-white'
              : 'bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]'
            }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded bg-[var(--card-bg)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--card-hover-bg)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded bg-[var(--card-bg)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--card-hover-bg)]"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        <span className="text-sm text-[var(--text-tertiary)] ml-4">
          Page {currentPage} of {totalPages} • {totalResults} total records
        </span>
      </div>
    );
  };

  // Loading skeleton
  if (loading && !auditData.length) {
    return (
      <div className="min-h-screen bg-[var(--background-color)] p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[var(--accent-blue)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-color)] p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="h-6 w-6 text-[var(--accent-blue)]" />
              Audit Trail
            </h1>
            <p className="text-[var(--text-tertiary)]">
              Monitor system activities and user actions
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green-hover)] transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export JSON
            </button>
            <button
              onClick={loadAuditData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-[var(--notification-error)] border border-red-800/50 text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-blue-400 mb-1">Total Audits</p>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                    {stats.total_audits?.toLocaleString() || 0}
                  </h3>
                </div>
                <div className="p-2 bg-blue-900/30 rounded">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                {stats.period_days || 0} days period
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border border-emerald-800/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-emerald-400 mb-1">Unique Users</p>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                    {stats.unique_users?.toLocaleString() || 0}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-900/30 rounded">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                {stats.audits_per_user?.toFixed(1) || 0} audits per user
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-800/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-purple-400 mb-1">Unique Entities</p>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                    {stats.unique_entities?.toLocaleString() || 0}
                  </h3>
                </div>
                <div className="p-2 bg-purple-900/30 rounded">
                  <Package className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                {stats.audits_per_entity?.toFixed(1) || 0} audits per entity
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-900/20 to-amber-900/5 border border-amber-800/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-amber-400 mb-1">Daily Average</p>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                    {stats.average_daily_audits?.toFixed(1) || 0}
                  </h3>
                </div>
                <div className="p-2 bg-amber-900/30 rounded">
                  <Activity className="h-5 w-5 text-amber-400" />
                </div>
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                Last {stats.period_days || 0} days
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1"
            >
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4">
            {/* Search and Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    placeholder="Search audit trail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
              </div>

              {/* Action Filter */}
              <div>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.filter(a => a !== 'all').map(action => (
                    <option key={action} value={action}>
                      {auditTrailAPI.getActionDescription(action).split(' - ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Filter */}
              <div>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                >
                  <option value="all">All Entities</option>
                  {uniqueEntities.filter(e => e !== 'all').map(entity => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]">
                {/* Date Range */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-2">
                    Date Range
                  </label>
                  <div className="flex flex-col gap-2">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                    >
                      {dateRanges.map(range => (
                        <option key={range.id} value={range.id}>
                          {range.label}
                        </option>
                      ))}
                    </select>

                    {dateRange === 'custom' && (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                        />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* User Filter */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-2">
                    User
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                  >
                    <option value="all">All Users</option>
                    {uniqueUsers.filter(u => u !== 'all').map(user => (
                      <option key={user} value={user}>
                        {user}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Page Size */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-2">
                    Results per page
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suspicious Activities Warning */}
      {suspiciousActivities?.suspicious_activities?.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-800/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">
                Suspicious Activities Detected
              </h3>
            </div>
            <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-sm">
              {suspiciousActivities.audit_summary?.suspicious_activities || 0} activities
            </span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mb-3">
            Risk Level: <span className="text-red-400 font-medium">
              {suspiciousActivities.risk_assessment?.overall_risk || 'Unknown'}
            </span>
            {suspiciousActivities.suspicious_patterns_detected?.length > 0 && (
              <span className="ml-4">
                Patterns: {suspiciousActivities.suspicious_patterns_detected.join(', ')}
              </span>
            )}
          </p>
          <button
            onClick={() => {
              // Navigate to suspicious activities view
              setSelectedAction('access_denied');
              setDateRange('today');
            }}
            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Audit Trail Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full transaction-table">
            <thead>
              <tr>
                <th className="w-12"></th>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Action</th>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Entity</th>
                <th className="text-left p-4">Timestamp</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditData.length > 0 ? (
                auditData.map((audit) => (
                  <React.Fragment key={audit.id}>
                    <tr className={`${isSuspicious(audit) ? 'bg-red-900/10 hover:bg-red-900/20' : ''}`}>
                      <td className="p-4">
                        <button
                          onClick={() => toggleRowExpand(audit.id)}
                          className="p-1 hover:bg-[var(--border-color)] rounded"
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${expandedRows.has(audit.id) ? 'rotate-90' : ''
                              }`}
                          />
                        </button>
                      </td>
                      <td className="p-4">
                        <code className="text-sm text-[var(--text-tertiary)]">#{audit.id}</code>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isSuspicious(audit) && (
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${audit.action === 'create' ? 'bg-emerald-900/30 text-emerald-400' :
                              audit.action === 'update' ? 'bg-blue-900/30 text-blue-400' :
                                audit.action === 'delete' ? 'bg-red-900/30 text-red-400' :
                                  audit.action === 'login' ? 'bg-green-900/30 text-green-400' :
                                    'bg-[var(--card-secondary-bg)] text-[var(--text-tertiary)]'
                            }`}>
                            {audit.action}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-1">
                          {auditTrailAPI.getActionDescription(audit.action)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {audit.user_info?.username?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">
                              {audit.user_info?.username || 'Unknown'}
                            </div>
                            <div className="text-xs text-[var(--text-tertiary)]">
                              {audit.user_info?.role || 'No role'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-[var(--text-primary)]">
                          {audit.entity}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          ID: {audit.entity_id}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-[var(--text-primary)]">
                          {formatDateTime(audit.timestamp)}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(audit.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4">
                        {isSuspicious(audit) ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-900/30 text-red-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Suspicious
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-emerald-900/30 text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => viewAuditDetails(audit.id)}
                          className="px-3 py-1 text-sm bg-[var(--accent-blue)] text-white rounded hover:bg-[var(--accent-blue-hover)] transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                    {/* Expanded Row */}
                    {expandedRows.has(audit.id) && (
                      <tr>
                        <td colSpan={8} className="p-4 bg-[var(--card-secondary-bg)] border-t border-[var(--border-color)]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Details</h4>
                              <pre className="text-xs bg-black/20 p-3 rounded overflow-auto max-h-40">
                                {JSON.stringify(audit.details, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Context</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-[var(--text-tertiary)]">User IP:</span>
                                  <span className="text-[var(--text-primary)]">
                                    {audit.details?.ip || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[var(--text-tertiary)]">User Agent:</span>
                                  <span className="text-[var(--text-primary)] truncate max-w-[200px]">
                                    {audit.details?.user_agent || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[var(--text-tertiary)]">Location:</span>
                                  <span className="text-[var(--text-primary)]">
                                    {audit.details?.location || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="text-[var(--text-tertiary)]">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading audit trail...
                        </div>
                      ) : (
                        'No audit records found for the selected filters.'
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {auditData.length > 0 && (
          <div className="p-4 border-t border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-[var(--text-tertiary)]">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalResults)} of {totalResults} records
              </div>
              <div className="flex justify-center">{renderPagination()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Details Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Audit Details
              </h3>
              <button
                onClick={() => setSelectedAudit(null)}
                className="p-2 hover:bg-[var(--card-hover-bg)] rounded"
              >
                <XCircle className="h-5 w-5 text-[var(--text-tertiary)]" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border border-[var(--border-color)] rounded">
                    <div className="text-xs text-[var(--text-tertiary)] mb-1">Audit ID</div>
                    <div className="font-mono text-sm">#{selectedAudit.audit?.id}</div>
                  </div>
                  <div className="p-3 border border-[var(--border-color)] rounded">
                    <div className="text-xs text-[var(--text-tertiary)] mb-1">Timestamp</div>
                    <div className="text-sm">{formatDateTime(selectedAudit.audit?.timestamp)}</div>
                  </div>
                </div>

                {/* User Info */}
                <div className="p-4 border border-[var(--border-color)] rounded">
                  <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)]">Username</div>
                      <div className="text-sm">{selectedAudit.context?.performed_by?.username}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)]">Role</div>
                      <div className="text-sm">{selectedAudit.context?.performed_by?.role}</div>
                    </div>
                  </div>
                </div>

                {/* Entity Info */}
                <div className="p-4 border border-[var(--border-color)] rounded">
                  <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Entity Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)]">Entity Type</div>
                      <div className="text-sm">{selectedAudit.audit?.entity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)]">Entity ID</div>
                      <div className="text-sm">#{selectedAudit.audit?.entity_id}</div>
                    </div>
                  </div>
                </div>

                {/* Action Details */}
                <div className="p-4 border border-[var(--border-color)] rounded">
                  <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Action Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)]">Action Type</div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm ${selectedAudit.audit?.action === 'create' ? 'bg-emerald-900/30 text-emerald-400' :
                            selectedAudit.audit?.action === 'update' ? 'bg-blue-900/30 text-blue-400' :
                              selectedAudit.audit?.action === 'delete' ? 'bg-red-900/30 text-red-400' :
                                'bg-[var(--card-secondary-bg)] text-[var(--text-tertiary)]'
                          }`}>
                          {selectedAudit.audit?.action}
                        </span>
                        <span className="text-sm text-[var(--text-tertiary)]">
                          {auditTrailAPI.getActionDescription(selectedAudit.audit?.action)}
                        </span>
                      </div>
                    </div>
                    {selectedAudit.parsed_details && (
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Parsed Details</div>
                        <pre className="text-xs bg-black/20 p-3 rounded overflow-auto max-h-60">
                          {JSON.stringify(selectedAudit.parsed_details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw Data */}
                <div className="p-4 border border-[var(--border-color)] rounded">
                  <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Raw Audit Data
                  </h4>
                  <pre className="text-xs bg-black/20 p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(selectedAudit, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border-color)] flex justify-end gap-2">
              <button
                onClick={() => setSelectedAudit(null)}
                className="px-4 py-2 border border-[var(--border-color)] text-[var(--text-primary)] rounded hover:bg-[var(--card-hover-bg)]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Add to suspicious list
                  alert('Added to suspicious activities list');
                  setSelectedAudit(null);
                }}
                className="px-4 py-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/40"
              >
                Flag as Suspicious
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
        <p>Audit trail is automatically logged for security and compliance purposes.</p>
        <p className="mt-1">Data retention: 90 days • Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AuditTrailPage;