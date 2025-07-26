// Global type declarations to fix ESLint/TypeScript issues

import * as React from 'react';

declare global {
  // Browser globals
  interface Window {
    [key: string]: any;
  }
  
  // DOM globals that might not be available in all contexts
  const document: Document;
  const window: Window;
  const localStorage: Storage;
  const alert: (message?: any) => void;
  const confirm: (message?: string) => boolean;
  const prompt: (message?: string, defaultText?: string) => string | null;
  
  // React global
  const React: typeof import('react');
  
  // HTML Element types
  const HTMLButtonElement: {
    prototype: HTMLButtonElement;
    new(): HTMLButtonElement;
  };
  
  const HTMLDivElement: {
    prototype: HTMLDivElement;
    new(): HTMLDivElement;
  };
  
  const HTMLFormElement: {
    prototype: HTMLFormElement;
    new(): HTMLFormElement;
  };
  
  const HTMLInputElement: {
    prototype: HTMLInputElement;
    new(): HTMLInputElement;
  };
  
  const HTMLLabelElement: {
    prototype: HTMLLabelElement;
    new(): HTMLLabelElement;
  };
  
  const HTMLParagraphElement: {
    prototype: HTMLParagraphElement;
    new(): HTMLParagraphElement;
  };
  
  const HTMLHeadingElement: {
    prototype: HTMLHeadingElement;
    new(): HTMLHeadingElement;
  };
}

export {};
