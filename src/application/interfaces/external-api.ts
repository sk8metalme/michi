/**
 * ExternalAPIClient Interface (Port)
 *
 * Application layer interface for external API communication
 * Infrastructure layer provides the implementation (Adapter)
 */

import type { Result } from '../../shared/types/result.js';
import type { NetworkError } from '../../shared/types/errors.js';

/**
 * HTTP Method
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * HTTP Request Options
 */
export interface HTTPRequestOptions {
  method: HTTPMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

/**
 * HTTP Response
 */
export interface HTTPResponse<T> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

/**
 * External API Client Interface
 *
 * Generic HTTP client for external API communication
 */
export interface ExternalAPIClient {
  /**
   * Send HTTP request
   *
   * @param options - Request options
   * @returns Success with HTTPResponse or failure with NetworkError
   */
  request<T>(
    options: HTTPRequestOptions
  ): Promise<Result<HTTPResponse<T>, NetworkError>>;

  /**
   * GET request
   *
   * @param url - Request URL
   * @param headers - Optional headers
   * @returns Success with HTTPResponse or failure with NetworkError
   */
  get<T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<Result<HTTPResponse<T>, NetworkError>>;

  /**
   * POST request
   *
   * @param url - Request URL
   * @param body - Request body
   * @param headers - Optional headers
   * @returns Success with HTTPResponse or failure with NetworkError
   */
  post<T>(
    url: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<Result<HTTPResponse<T>, NetworkError>>;

  /**
   * PUT request
   *
   * @param url - Request URL
   * @param body - Request body
   * @param headers - Optional headers
   * @returns Success with HTTPResponse or failure with NetworkError
   */
  put<T>(
    url: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<Result<HTTPResponse<T>, NetworkError>>;

  /**
   * DELETE request
   *
   * @param url - Request URL
   * @param headers - Optional headers
   * @returns Success with HTTPResponse or failure with NetworkError
   */
  delete<T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<Result<HTTPResponse<T>, NetworkError>>;
}
