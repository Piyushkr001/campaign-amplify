import axios from 'axios';

export interface FormattedApiError {
  code: string;
  message: string;
  details?: any;
}

export function formatApiError(error: unknown): FormattedApiError {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data?.error;
    if (errorData && typeof errorData === 'object') {
      const code = errorData.code || 'API_ERROR';
      let message = errorData.message || 'An error occurred while communicating with the server.';

      switch (code) {
        case 'CAMPAIGN_INCOMPLETE': {
          const step = errorData.details?.step || 'required';
          const fields = Array.isArray(errorData.details?.fields)
            ? errorData.details.fields.join(', ')
            : '';
          message = `Please complete the ${step} section before submitting. Missing: ${fields}`;
          break;
        }
        case 'CAMPAIGN_NOT_FOUND':
          message = 'Campaign not found or no longer available.';
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
