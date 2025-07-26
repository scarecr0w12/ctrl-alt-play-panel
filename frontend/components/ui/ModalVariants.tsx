import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Modal, ModalProps } from './Modal';
import { Button } from './Button';

// Confirmation Modal
export interface ConfirmationModalProps extends Omit<ModalProps, 'children'> {
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  variant = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmLoading = false,
  onClose,
  ...modalProps
}) => {
  const icons = {
    danger: <XCircleIcon className="w-6 h-6 text-red-600" />,
    warning: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />,
    info: <InformationCircleIcon className="w-6 h-6 text-blue-600" />,
  };

  const confirmButtonVariants = {
    danger: 'destructive' as const,
    warning: 'default' as const,
    info: 'default' as const,
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <Modal {...modalProps} onClose={onClose} size="sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {icons[variant]}
        </div>
        <div className="flex-1">
          <div className="mt-3 text-center sm:mt-0 sm:text-left">
            {modalProps.title && (
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {modalProps.title}
              </h3>
            )}
            {modalProps.description && (
              <p className="text-sm text-gray-500">
                {modalProps.description}
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={confirmLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmButtonVariants[variant]}
              onClick={onConfirm}
              loading={confirmLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Alert Modal (Info display)
export interface AlertModalProps extends Omit<ModalProps, 'children'> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  variant = 'info',
  message,
  buttonText = 'OK',
  onButtonClick,
  onClose,
  ...modalProps
}) => {
  const icons = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
    error: <XCircleIcon className="w-6 h-6 text-red-600" />,
    warning: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />,
    info: <InformationCircleIcon className="w-6 h-6 text-blue-600" />,
  };

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose();
    }
  };

  return (
    <Modal {...modalProps} onClose={onClose} size="sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {icons[variant]}
        </div>
        <div className="flex-1">
          <div className="mt-3 text-center sm:mt-0 sm:text-left">
            {modalProps.title && (
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {modalProps.title}
              </h3>
            )}
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              variant="default"
              onClick={handleButtonClick}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Form Modal
export interface FormModalProps extends Omit<ModalProps, 'children'> {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  submitLoading?: boolean;
  submitDisabled?: boolean;
  onCancel?: () => void;
}

export const FormModal: React.FC<FormModalProps> = ({
  children,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  submitLoading = false,
  submitDisabled = false,
  onCancel,
  onClose,
  ...modalProps
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal {...modalProps} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>{children}</div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitLoading}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              loading={submitLoading}
              disabled={submitDisabled}
            >
              {submitText}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

// Drawer Modal (Slide from side)
export interface DrawerModalProps extends Omit<ModalProps, 'children'> {
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: string;
}

export const DrawerModal: React.FC<DrawerModalProps> = ({
  children,
  position = 'right',
  width = '400px',
  isOpen,
  onClose,
  title,
  ...props
}) => {
  const slideClasses = {
    left: 'transform translate-x-0',
    right: 'transform translate-x-0',
  };

  const slideFromClasses = {
    left: 'transform -translate-x-full',
    right: 'transform translate-x-full',
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 ${position}-0 flex max-w-full`}
        style={{ width }}
      >
        <div
          className={`w-full bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            isOpen ? slideClasses[position] : slideFromClasses[position]
          }`}
        >
          {/* Header */}
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};