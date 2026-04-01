import axios from 'axios';

type ValidationPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong. Please try again.';
  }

  const data = error.response?.data as ValidationPayload | undefined;

  if (data?.errors) {
    const firstMessage = Object.values(data.errors).flat()[0];

    if (firstMessage) {
      return firstMessage;
    }
  }

  if (data?.message) {
    return data.message;
  }

  if (error.response?.status === 422) {
    return 'Please correct the highlighted form data and try again.';
  }

  return 'Request failed. Please try again.';
}
