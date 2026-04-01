import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '@/lib/api/auth';

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}
