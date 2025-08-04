import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  Trash2, 
  Shield, 
  Database, 
  Activity,
  Settings as SettingsIcon,
  Trophy
} from 'lucide-react';
import type { User } from '../../services/supabaseAuthService';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User;
  isDeleting: boolean;
}

const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isDeleting
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning');
  
  const requiredText = `DELETE ${user.email}`;
  const isConfirmationValid = confirmationText === requiredText;

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting]);

  const handleNextStep = () => {
    setStep('confirmation');
  };

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setStep('warning');
      setConfirmationText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity cursor-pointer" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="flex min-h-full items-center justify-center p-2 sm:p-4"
        onClick={handleClose}
      >
        <div 
          className="relative w-full max-w-sm sm:max-w-md transform overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="relative bg-red-50 dark:bg-red-900/20 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-red-900 dark:text-red-100">
                  Delete Account
                </h3>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            {/* Close button */}
            {!isDeleting && (
              <button
                onClick={handleClose}
                className="absolute right-2 sm:right-4 top-2 sm:top-4 rounded-lg p-1 text-red-400 hover:bg-red-100 dark:hover:bg-red-800/50 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            {step === 'warning' ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <Trash2 className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="mt-2 sm:mt-3 text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                    Permanently Delete Account
                  </h4>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
                    You are about to delete your account for <strong className="break-all">{user.email}</strong>
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 text-sm sm:text-base">
                    This will permanently delete:
                  </h5>
                  
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                      <span>Your user profile and account settings</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span>All problem progress and solutions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                      <span>Study session history and analytics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                      <span>Streak data and achievements</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span>All stored preferences and settings</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2.5 sm:p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Warning:</strong> This action is irreversible. All your data will be permanently lost and cannot be recovered.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="mt-3 text-lg font-medium text-gray-900 dark:text-gray-100">
                    Final Confirmation
                  </h4>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    This is your last chance to cancel
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    To confirm deletion, type exactly: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-red-600 dark:text-red-400 font-mono">{requiredText}</code>
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type the confirmation text..."
                    disabled={isDeleting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  
                  {confirmationText && !isConfirmationValid && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Text doesn't match. Please type exactly: {requiredText}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex space-x-2 sm:space-x-3">
              {step === 'warning' ? (
                <>
                  <button
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={isDeleting}
                    className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep('warning')}
                    disabled={isDeleting}
                    className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!isConfirmationValid || isDeleting}
                    className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Account</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletionModal;
