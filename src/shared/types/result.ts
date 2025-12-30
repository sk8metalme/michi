/**
 * Result Type - Discriminated Union for Type-Safe Error Handling
 *
 * Functional error handling pattern following Railway-Oriented Programming
 */

/**
 * Result type representing either success or failure
 *
 * @template T - Type of success value
 * @template E - Type of error value
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Create a successful result
 *
 * @param value - Success value
 * @returns Success result
 */
export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * Create a failure result
 *
 * @param error - Error value
 * @returns Failure result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Check if result is successful
 *
 * @param result - Result to check
 * @returns True if success
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success === true;
}

/**
 * Check if result is failure
 *
 * @param result - Result to check
 * @returns True if failure
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}
