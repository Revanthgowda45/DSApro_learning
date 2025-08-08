import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Settings as SettingsIcon,
  Shield,
  FileText,
  FileDown,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { DataExportService } from '../services/dataExportService';
import { AccountDeletionService } from '../services/accountDeletionService';
import ThemeSelector from '../components/settings/ThemeSelector';
import LearningPreferences from '../components/settings/LearningPreferences';
import NotificationSettings from '../components/settings/NotificationSettings';
import AccountDeletionModal from '../components/modals/AccountDeletionModal';

export default function Settings() {
  const { user } = useAuth();
  // Notification settings are now handled by NotificationSettings component
  
  // Performance monitoring
  useEffect(() => {
    const monitor = PerformanceMonitor.monitorComponent('Settings');
    const endRender = monitor.onRenderStart();
    
    return () => {
      endRender();
    };
  }, []);

  // Notification settings are now handled by NotificationSettings component
  
  // State for export operations
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // State for account deletion
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Clear export notifications after 5 seconds
  useEffect(() => {
    if (exportSuccess || exportError) {
      const timer = setTimeout(() => {
        setExportSuccess(null);
        setExportError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccess, exportError]);

  // CSV data export handler
  const handleDataExportCSV = useCallback(async () => {
    if (!user) return;
    
    const timer = PerformanceMonitor.startTimer('settings_data_export_csv');
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);
    
    try {
      console.log('🔄 Starting CSV data export for user:', user.email);
      await DataExportService.downloadUserDataCSV(user);
      setExportSuccess('Data exported successfully as CSV file!');
      console.log('✅ CSV export completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Failed to export CSV data:', error);
      setExportError(`CSV export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      timer();
    }
  }, [user]);

  // PDF data export handler
  const handleDataExportPDF = useCallback(async () => {
    if (!user) return;
    
    const timer = PerformanceMonitor.startTimer('settings_data_export_pdf');
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);
    
    try {
      console.log('🔄 Starting PDF data export for user:', user.email);
      await DataExportService.downloadUserDataPDF(user);
      setExportSuccess('Progress report exported successfully as PDF!');
      console.log('✅ PDF export completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Failed to export PDF data:', error);
      setExportError(`PDF export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      timer();
    }
  }, [user]);
  
  // Show account deletion modal
  const handleAccountDeletion = useCallback(() => {
    if (!user) return;
    setShowDeleteModal(true);
  }, [user]);

  // Actual account deletion handler (called from modal)
  const handleConfirmAccountDeletion = useCallback(async () => {
    if (!user) return;
    
    const timer = PerformanceMonitor.startTimer('settings_account_deletion');
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    
    try {
      console.log('🔄 Starting account deletion for user:', user.email);
      
      // Perform the actual deletion
      await AccountDeletionService.deleteAccount(user);
      
      setDeleteSuccess('Account deleted successfully. You will be redirected shortly.');
      console.log('✅ Account deletion completed successfully');
      setShowDeleteModal(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Failed to delete account:', error);
      setDeleteError(`Account deletion failed: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      timer();
    }
  }, [user]);

  // Close modal handler
  const handleCloseDeleteModal = useCallback(() => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setDeleteError(null);
    }
  }, [isDeleting]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Customize your DSA learning experience
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={user?.full_name || user?.username || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
          </div>
          
          <ThemeSelector />
        </div>

        {/* Learning Preferences */}
        <LearningPreferences onPreferencesUpdate={() => {
          // Refresh the page or update local state when preferences change
          window.location.reload();
        }} />

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <NotificationSettings />
        </div>

        {/* Data & Privacy */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Data & Privacy</h2>
          </div>
          
          {/* Export Success/Error Messages */}
          {(exportSuccess || exportError) && (
            <div className={`p-4 rounded-lg border ${exportSuccess 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {exportSuccess ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <p className={`text-sm font-medium ${
                  exportSuccess 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {exportSuccess || exportError}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* CSV Export Button */}
            <button 
              onClick={handleDataExportCSV}
              disabled={isExporting}
              className="flex items-center space-x-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className={`h-5 w-5 text-green-600 dark:text-green-400 ${isExporting ? 'animate-bounce' : ''}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isExporting ? 'Exporting Data...' : 'Export Data (CSV)'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Download your data in spreadsheet-friendly CSV format
                </p>
              </div>
            </button>

            {/* PDF Export Button */}
            <button 
              onClick={handleDataExportPDF}
              disabled={isExporting}
              className="flex items-center space-x-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className={`h-5 w-5 text-purple-600 dark:text-purple-400 ${isExporting ? 'animate-bounce' : ''}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isExporting ? 'Generating Report...' : 'Export Progress Report (PDF)'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Download a beautifully formatted progress report as PDF
                </p>
              </div>
            </button>
            
            <button 
              onClick={handleAccountDeletion}
              disabled={isDeleting}
              className="flex items-center space-x-3 w-full text-left p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className={`h-5 w-5 text-red-600 dark:text-red-400 ${isDeleting ? 'animate-pulse' : ''}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isDeleting ? 'This may take a moment...' : 'Permanently delete your account and data'}
                </p>
              </div>
            </button>
            
            {/* Delete Account Success/Error Messages */}
            {deleteSuccess && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-300">{deleteSuccess}</p>
              </div>
            )}
            
            {deleteError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Account Deletion Modal */}
      {user && (
        <AccountDeletionModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmAccountDeletion}
          user={user}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
