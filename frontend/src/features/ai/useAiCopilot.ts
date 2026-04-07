import { useMutation } from '@tanstack/react-query';
import { sendAiCopilotMessage, type SendAiCopilotMessagePayload } from '@/lib/api/aiCopilot';

export function useAiCopilot() {
  return useMutation({
    mutationFn: (payload: SendAiCopilotMessagePayload) => sendAiCopilotMessage(payload),
  });
}
