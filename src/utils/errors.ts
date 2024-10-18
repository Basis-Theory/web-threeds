const errorMessagesMap: Record<string, string> = {
  // Add mappings for specific error titles or details
  // 'Some Error Title': 'A user-friendly error message.',
};

const validationErrorMessagesMap: Record<string, string> = {
  'The card was not supported by any card schemes': '3DS is not supported for the provided card',
  // Add mappings for specific error titles or details as needed
};

type ApiError = {
  title?: string;
  status?: number;
  detail?: string;
};

type ValidationApiError = ApiError & {
  errors: Record<string, string[]>;
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
  } else {
    if (apiError.title && errorMessagesMap[apiError.title]) {
      throw new Error(errorMessagesMap[apiError.title]);
    }
  }

  // if no matching mapping is found, throw a generic error
  throw new Error(apiError.title || 'An unknown error occurred');
};

export { processApiError, isApiError };
