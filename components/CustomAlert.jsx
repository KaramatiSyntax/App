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

  // Memoize alert config for performance
  const alertConfig = useMemo(() => ({
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-600/10',
      borderColor: 'border-green-500/20',
      titleColor: 'text-green-400',
      messageColor: 'text-green-200',
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-600/10',
      borderColor: 'border-red-500/20',
      titleColor: 'text-red-400',
      messageColor: 'text-red-200',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-600/10',
      borderColor: 'border-yellow-500/20',
      titleColor: 'text-yellow-400',
      messageColor: 'text-yellow-200',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-600/10',
      borderColor: 'border-blue-500/20',
      titleColor: 'text-blue-400',
      messageColor: 'text-blue-200',
    },
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
          initial={{ opacity: 0, y: -50, scale: 0.8, rotateX: -15 }}
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
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none"
        >
          <div className={`
            ${config.bgColor} ${config.borderColor}
            border-2 rounded-2xl p-4 shadow-2xl backdrop-blur-md
            bg-black/40
            transition-all duration-300 ease-out
            pointer-events-auto
          `}>
            {/* Custom glowing inner shadow */}
            <div className={`absolute inset-0 rounded-2xl ring-1 ${config.borderColor} ring-inset opacity-70`} />
            <div className="relative flex items-start gap-3">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mt-0.5 flex-shrink-0"
                >
                  <Loader2 className={`w-5 h-5 ${config.iconColor}`} />
                </motion.div>
              ) : (
                <IconComponent className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className={`font-semibold text-sm ${config.titleColor}`}>
                    {title}
                  </h3>
                )}
                <p className={`text-sm ${config.messageColor} break-words`}>
                  {message}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                disabled={isLoading}
                aria-label="Close"
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