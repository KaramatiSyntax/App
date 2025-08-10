"use client";

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import CustomAlert from './CustomAlert';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    duration: 4000,
    showLoading: false
  });

  const showAlert = useCallback((type, title, message, duration = 4000, showLoading = false) => {
    // Immediately set the alert without any delays
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      duration,
      showLoading
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showLoadingAlert = useCallback((title, message) => {
    showAlert('info', title, message, 0, true);
  }, [showAlert]);

  const showSuccessAlert = useCallback((title, message, duration = 4000) => {
    showAlert('success', title, message, duration);
  }, [showAlert]);

  const showErrorAlert = useCallback((title, message, duration = 5000) => {
    showAlert('error', title, message, duration);
  }, [showAlert]);

  const showWarningAlert = useCallback((title, message, duration = 4000) => {
    showAlert('warning', title, message, duration);
  }, [showAlert]);

  const showInfoAlert = useCallback((title, message, duration = 4000) => {
    showAlert('info', title, message, duration);
  }, [showAlert]);

  const value = useMemo(() => ({
    alert,
    showAlert,
    hideAlert,
    showLoadingAlert,
    showSuccessAlert,
    showErrorAlert,
    showWarningAlert,
    showInfoAlert
  }), [alert, showAlert, hideAlert, showLoadingAlert, showSuccessAlert, showErrorAlert, showWarningAlert, showInfoAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={hideAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        duration={alert.duration}
        showLoading={alert.showLoading}
      />
    </AlertContext.Provider>
  );
}; 