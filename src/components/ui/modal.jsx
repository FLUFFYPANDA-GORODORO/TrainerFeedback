import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Custom Modal component - no Radix, no scroll lock issues
 */
const Modal = ({ open, onOpenChange, children, className }) => {
  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && open) {
      onOpenChange(false);
    }
  }, [open, onOpenChange]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  // Add/remove escape listener
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 animate-in fade-in-0" />
      
      {/* Modal Content */}
      <div 
        className={cn(
          "relative z-50 w-full max-w-lg bg-background border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const ModalContent = ({ children, className }) => (
  <div className={cn("relative", className)}>
    {children}
  </div>
);

const ModalHeader = ({ children, className }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
    {children}
  </div>
);

const ModalTitle = ({ children, className }) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
    {children}
  </h2>
);

const ModalDescription = ({ children, className }) => (
  <p className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </p>
);

const ModalFooter = ({ children, className }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
    {children}
  </div>
);

const ModalClose = ({ onClose, className }) => (
  <button
    onClick={onClose}
    className={cn(
      "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      className
    )}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
);

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose
};
