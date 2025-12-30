/**
 * Error Type Hierarchy
 *
 * Domain-Driven Design error classification for Onion Architecture
 */

/**
 * Base Domain Error
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * Validation Error (Domain Layer)
 */
export class ValidationError extends DomainError {
  constructor(
    public field: string,
    public constraint: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Base Application Error
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationError';
  }
}

/**
 * Resource Not Found Error (Application Layer)
 */
export class ResourceNotFoundError extends ApplicationError {
  constructor(public resourceType: string, public resourceId: string) {
    super(`${resourceType} not found: ${resourceId}`);
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * Base Infrastructure Error
 */
export class InfrastructureError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'InfrastructureError';
  }
}

/**
 * Repository Error Types (Application Layer Interface)
 */
export type RepositoryError =
  | { type: 'NotFound'; featureName: string }
  | { type: 'ReadError'; path: string; cause: string }
  | { type: 'WriteError'; path: string; cause: string }
  | { type: 'ParseError'; path: string; cause: string };

/**
 * File System Error Types (Infrastructure Layer)
 */
export type FileSystemError =
  | { type: 'FileNotFound'; path: string }
  | { type: 'PermissionDenied'; path: string }
  | { type: 'ReadError'; path: string; cause: Error };

/**
 * Network Error Types (Infrastructure Layer)
 */
export type NetworkError =
  | { type: 'Timeout'; url: string; timeout: number }
  | { type: 'ConnectionFailed'; url: string; cause: string }
  | { type: 'RequestFailed'; url: string; status: number; message: string };

/**
 * Config Error Types (Infrastructure Layer)
 */
export type ConfigError =
  | { type: 'FileNotFound'; path: string }
  | { type: 'ParseError'; path: string; cause: string }
  | { type: 'ValidationError'; field: string; message: string }
  | { type: 'MissingRequired'; field: string };

/**
 * Template Error Types (Application Layer)
 */
export type TemplateError =
  | { type: 'TemplateNotFound'; path: string }
  | { type: 'InvalidPlaceholder'; placeholder: string };

/**
 * Use Case Error Types (Application Layer)
 */
export type UseCaseError =
  | { type: 'InvalidInput'; message: string }
  | { type: 'DuplicateFeatureName'; featureName: string }
  | { type: 'RepositoryError'; cause: RepositoryError };
