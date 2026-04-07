import { apiClient } from '@/lib/api/client';
import type { AiCopilotContext, AiCopilotHistoryMessage, AiCopilotResponse } from '@/types/domain';

export type SendAiCopilotMessagePayload = {
  context: AiCopilotContext;
  message: string;
  history?: AiCopilotHistoryMessage[];
};

export async function sendAiCopilotMessage(payload: SendAiCopilotMessagePayload): Promise<AiCopilotResponse> {
  const { data } = await apiClient.post('/ai/copilot/messages', payload);
  return data;
}
