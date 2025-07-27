/**
 * Schema validation utilities
 */

export interface ValidationError extends Error {
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Basic validation helper
 */
export function validateSchema(data: unknown, schema: Record<string, unknown>): void {
  const errors: Array<{ field: string; message: string }> = [];
  
  if (typeof data !== 'object' || data === null) {
    const error = new Error('Validation failed: Data must be an object') as ValidationError;
    error.errors = [{ field: 'root', message: 'Data must be an object' }];
    throw error;
  }
  
  const obj = data as Record<string, unknown>;
  
  // Basic required field validation
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        errors.push({ field: field as string, message: `Field '${field}' is required` });
      }
    }
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed') as ValidationError;
    error.errors = errors;
    throw error;
  }
}
