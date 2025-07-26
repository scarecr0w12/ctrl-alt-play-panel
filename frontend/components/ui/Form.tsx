import React from 'react';
import { cn } from '../../lib/utils';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export interface FormErrorProps {
  message?: string;
  className?: string;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, onSubmit, children, ...props }, ref) => (
    <form
      ref={ref}
      className={cn('space-y-6', className)}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  )
);

export const FormField: React.FC<FormFieldProps> = ({ children, className }) => (
  <div className={cn('space-y-2', className)}>
    {children}
  </div>
);

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'block text-sm font-medium text-gray-700',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
);

export const FormError: React.FC<FormErrorProps> = ({ message, className }) => {
  if (!message) return null;
  
  return (
    <p className={cn('text-sm text-red-600', className)}>
      {message}
    </p>
  );
};

export const FormDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <p className={cn('text-sm text-gray-500', className)}>
    {children}
  </p>
);

Form.displayName = 'Form';
FormLabel.displayName = 'FormLabel';
