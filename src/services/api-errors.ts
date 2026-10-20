import axios from 'axios';
import { CampaignApiErrorCode } from '@/types/campaign-api';

export interface FormattedApiError {
  code: CampaignApiErrorCode | string;
  message: string;
  details?: unknown;
}

export function formatApiError(error: unknown): FormattedApiError {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data?.error;
    if (errorData && typeof errorData === 'object') {
      const code = (errorData.code as string) || 'API_ERROR';
      let message = errorData.message || 'An error occurred while communicating with the server.';

      switch (code) {
        case 'CAMPAIGN_INCOMPLETE': {
          const details = errorData.details as { step?: string; fields?: string[] } | undefined;
          const step = details?.step || 'required';
          const fields = Array.isArray(details?.fields)
            ? details.fields.join(', ')
            : '';
          message = `Please complete the ${step} section before submitting. Missing: ${fields}`;
          break;
        }
        case 'INVALID_CAMPAIGN_ID':
          message = 'The specified campaign ID is invalid. Expected a valid system identifier.';
          break;
        case 'INVALID_CAMPAIGN_STATUS':
          message = errorData.message || 'The campaign is not in an editable or submittable status.';
          break;
        case 'CAMPAIGN_NOT_FOUND':
          message = 'Campaign not found or no longer available.';
          break;
        case 'CAMPAIGN_SYNC_FAILED':
          message = errorData.message || 'Failed to synchronize draft with the server.';
          break;
        case 'DATABASE_UNAVAILABLE':
          message = 'Backend database is temporarily unreachable. Your work is safely preserved on this device.';
          break;
        case 'VALIDATION_ERROR':
          message = errorData.message || 'Some entered fields are invalid. Please check your inputs.';
          break;
        case 'BAD_REQUEST':
          message = errorData.message || 'Invalid request. Please verify campaign data.';
          break;
        case 'INTERNAL_ERROR':
        case 'INTERNAL_SERVER_ERROR':
          message = 'A server error occurred. Your draft is safely saved on this device.';
          break;
      }

      return {
        code,
        message,
        details: errorData.details,
      };
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please check your connection and try again.',
      };
    }

    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to Amplify server. Operating in offline/local cache mode.',
      };
    }

    return {
      code: `HTTP_${error.response.status}`,
      message: `Server returned error (${error.response.status}).`,
    };
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const custom = error as { code: string; message: string; details?: unknown };
    return {
      code: custom.code,
      message: custom.message,
      details: custom.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'CLIENT_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
  };
}
