const validationErrorMessagesMap: Record<string, string> = {
  'The card was not supported by any card schemes':
    '3DS is not supported for the provided card',
  // Add mappings for specific error titles or details as needed
};

/**
 * Nested error details from the 3DS service
 * Normalized to camelCase for consistent JavaScript/TypeScript convention
 */
type ThreeDSServiceError = {
  serviceStatus?: string;
  sessionId?: string;
  errorSource?: string;
  message?: string;
  detail?: string;
};

/**
 * Raw API error format (may have snake_case from backend)
 */
type ApiError = {
  title?: string;
  status?: number;
  detail?: string;
  error?: {
    service_status?: string;
    session_id?: string;
    error_source?: string;
    message?: string;
    detail?: string;
    // Legacy camelCase support
    serviceStatus?: string;
    sessionId?: string;
    errorSource?: string;
    details?: string;
  };
};

type ValidationApiError = ApiError & {
  errors: Record<string, string[]>;
};

/**
 * Enhanced error type that includes the full API error structure
 */
type BasisTheory3dsError = Error & {
  title?: string;
  status?: number;
  detail?: string;
  error?: ThreeDSServiceError;
};

/**
 * Creates an error object that preserves the full API error structure
 * Normalizes snake_case (from API) to camelCase (JavaScript convention)
 */
const createBasisTheory3dsError = (apiError: ApiError): BasisTheory3dsError => {
  // Set the error message to be the most descriptive field available
  const message =
    apiError.error?.message ||
    apiError.detail ||
    apiError.title ||
    'An unknown error occurred';

  const error = new Error(message) as BasisTheory3dsError;
  error.name = 'BasisTheory3dsError';
  error.title = apiError.title;
  error.status = apiError.status;
  error.detail = apiError.detail;

  // Normalize the nested error object to camelCase for consistent JavaScript convention
  // This transforms snake_case from the API to match the rest of the SDK
  if (apiError.error) {
    error.error = {
      serviceStatus:
        apiError.error.service_status || apiError.error.serviceStatus,
      sessionId: apiError.error.session_id || apiError.error.sessionId,
      errorSource: apiError.error.error_source || apiError.error.errorSource,
      message: apiError.error.message,
      detail: apiError.error.detail || apiError.error.details,
    };
  }

  return error;
};

const isValidationApiError = (error: ApiError): error is ValidationApiError => {
  return (
    'errors' in error &&
    error.errors !== undefined &&
    typeof error.errors === 'object' &&
    error.errors !== null
  );
};

const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('title' in error || 'status' in error || 'detail' in error)
  );
};

const processApiError = (apiError: ApiError): never => {
  if (isValidationApiError(apiError)) {
    for (const errorKey of Object.keys(apiError.errors)) {
      if (validationErrorMessagesMap[errorKey]) {
        throw new Error(validationErrorMessagesMap[errorKey]);
      }
    }
  }

  // For all API errors (including 3DS service errors with status 424),
  // throw a custom error that preserves the full error structure
  throw createBasisTheory3dsError(apiError);
};

export { processApiError, isApiError };
export type { BasisTheory3dsError, ThreeDSServiceError };
