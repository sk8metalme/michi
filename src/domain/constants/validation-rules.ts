/**
 * Domain Constants - Validation Rules
 *
 * Defines validation rules and patterns for domain entities.
 */

/**
 * Feature name validation pattern (kebab-case)
 */
export const FEATURE_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Maximum length for feature names
 */
export const FEATURE_NAME_MAX_LENGTH = 50;

/**
 * Minimum length for feature names
 */
export const FEATURE_NAME_MIN_LENGTH = 3;

/**
 * Validate feature name format
 *
 * @param name - Feature name to validate
 * @returns True if valid, false otherwise
 */
export function isValidFeatureName(name: string): boolean {
  if (!name || name.length < FEATURE_NAME_MIN_LENGTH || name.length > FEATURE_NAME_MAX_LENGTH) {
    return false;
  }
  return FEATURE_NAME_PATTERN.test(name);
}

/**
 * Get validation error message for feature name
 *
 * @param name - Feature name that failed validation
 * @returns Error message describing the validation failure
 */
export function getFeatureNameValidationError(name: string): string {
  if (!name) {
    return 'Feature name is required';
  }
  if (name.length < FEATURE_NAME_MIN_LENGTH) {
    return `Feature name must be at least ${FEATURE_NAME_MIN_LENGTH} characters`;
  }
  if (name.length > FEATURE_NAME_MAX_LENGTH) {
    return `Feature name must not exceed ${FEATURE_NAME_MAX_LENGTH} characters`;
  }
  if (!FEATURE_NAME_PATTERN.test(name)) {
    return 'Feature name must be in kebab-case format (lowercase letters, numbers, and hyphens only)';
  }
  return 'Invalid feature name';
}
