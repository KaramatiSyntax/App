"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X, Loader2 } from 'lucide-react';

const CustomAlert = ({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title = '', 
  message = '', 
  duration = 4000,
  showLoading = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Memoize alert config to prevent re-renders
  const alertConfig = useMemo(() => ({
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      textColor: 'text-green-600',
      iconColor: 'text-green-500',
      titleColor: 'text-green-700 dark:text-green-300'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      textColor: 'text-red-600',
      iconColor: 'text-red-500',
      titleColor: 'text-red-700 dark:text-red-300'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      textColor: 'text-yellow-600',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-700 dark:text-blue-300'
    }
  }), []);

  const config = alertConfig[type];
  const IconComponent = config.icon;

  // Optimized close handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle loading state
  useEffect(() => {
    setIsLoading(showLoading);
  }, [showLoading]);

  // Handle auto-close timer
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, handleClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.3, rotateX: -15 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            rotateX: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.6
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -30, 
            scale: 0.8, 
            rotateX: -10,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 30,
              duration: 0.3
            }
          }}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md px-4"
        >
          <div className={`
            ${config.bgColor} ${config.borderColor} 
            border rounded-xl p-4 shadow-xl backdrop-blur-md
            bg-card/95
            transition-all duration-150 ease-out
          `}>
            <div className="flex items-start gap-3">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
                </motion.div>
              ) : (
                <IconComponent className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className={`font-semibold text-sm ${config.titleColor} mb-1`}>
                    {title}
                  </h3>
                )}
                <p className={`text-sm ${config.textColor} text-foreground`}>
                  {message}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-black/5"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert; 