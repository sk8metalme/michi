/**
 * ExternalAPIClient Interface Tests
 *
 * Verify that the interface contract is correctly defined
 */

import { describe, it, expect } from 'vitest';
import type { ExternalAPIClient } from '../../interfaces/external-api.js';
import { ok } from '../../../shared/types/result.js';

describe('ExternalAPIClient Interface', () => {
  it('should define all required methods', () => {
    const mockClient: ExternalAPIClient = {
      async request() {
        return ok({
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {},
        });
      },

      async get() {
        return ok({
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {},
        });
      },

      async post() {
        return ok({
          status: 201,
          statusText: 'Created',
          headers: {},
          data: {},
        });
      },

      async put() {
        return ok({
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {},
        });
      },

      async delete() {
        return ok({
          status: 204,
          statusText: 'No Content',
          headers: {},
          data: null,
        });
      },
    };

    expect(mockClient.request).toBeDefined();
    expect(mockClient.get).toBeDefined();
    expect(mockClient.post).toBeDefined();
    expect(mockClient.put).toBeDefined();
    expect(mockClient.delete).toBeDefined();
  });

  it('should return Result<HTTPResponse<T>, NetworkError> from get', async () => {
    const mockClient: ExternalAPIClient = {
      async request() {
        return ok({
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {},
        });
      },

      async get<T>() {
        return ok({
          status: 200,
          statusText: 'OK',
          headers: {},
          data: { message: 'success' } as T,
        });
      },

      async post() {
        return ok({
          status: 201,
          statusText: 'Created',
          headers: {},
          data: {},
        });
      },

      async put() {
        return ok({
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {},
        });
      },

      async delete() {
        return ok({
          status: 204,
          statusText: 'No Content',
          headers: {},
          data: null,
        });
      },
    };

    const result = await mockClient.get<{ message: string }>('https://api.example.com/test');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.status).toBe(200);
      expect(result.value.data.message).toBe('success');
    }
  });
});
