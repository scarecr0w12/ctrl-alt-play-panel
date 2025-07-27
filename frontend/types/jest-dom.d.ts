/// <reference types="@testing-library/jest-dom" />

declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveClass(className: string): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeVisible(): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toHaveValue(value: string | number): R;
    toHaveAttribute(attr: string, value?: string): R;
    toHaveStyle(css: string | object): R;
  }
}
