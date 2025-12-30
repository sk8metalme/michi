/**
 * Value Object - FeatureName
 *
 * Represents a validated feature name in kebab-case format
 */

import {
  isValidFeatureName,
  getFeatureNameValidationError,
} from '../constants/validation-rules.js';

/**
 * FeatureName Value Object
 *
 * Immutable value object that ensures feature names are always valid
 */
export class FeatureName {
  private readonly _value: string;

  constructor(value: string) {
    if (!isValidFeatureName(value)) {
      throw new Error(getFeatureNameValidationError(value));
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Check equality with another FeatureName
   */
  equals(other: FeatureName): boolean {
    return this._value === other._value;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this._value;
  }
}
