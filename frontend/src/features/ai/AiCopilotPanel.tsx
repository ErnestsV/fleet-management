import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, LoaderCircle, MessageSquareText, SendHorizontal, Sparkles, X } from 'lucide-react';
import { useAiCopilot } from '@/features/ai/useAiCopilot';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { AiCopilotHistoryMessage } from '@/types/domain';

type ChatMessage = AiCopilotHistoryMessage & {
  id: string;
  tone?: 'default' | 'error';
};

const SUGGESTED_PROMPTS = [
  'Summarize the current dashboard.',
  'What should I focus on first today?',
  'Why is fleet risk high right now?',
  'Explain the active alerts in plain English.',
];

const MAX_HISTORY_MESSAGES = 8;

function createMessage(role: ChatMessage['role'], content: string, tone: ChatMessage['tone'] = 'default'): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    tone,
  };
}

export function AiCopilotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', 'Ask about fleet risk, alerts, vehicles needing attention, or a dashboard summary.'),
  ]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const copilotMutation = useAiCopilot();

  const conversationHistory = useMemo(
    () => messages
      .filter((message) => message.tone !== 'error')
      .map<AiCopilotHistoryMessage>(({ role, content }) => ({ role, content }))
      .slice(-MAX_HISTORY_MESSAGES),
    [messages],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [isOpen, messages, copilotMutation.isPending]);

  async function submitMessage(input: string) {
    const trimmedInput = input.trim();

    if (!trimmedInput || copilotMutation.isPending) {
      return;
    }

    const nextUserMessage = createMessage('user', trimmedInput);
    const nextHistoryMessage: AiCopilotHistoryMessage = { role: 'user', content: trimmedInput };
    const nextHistory = [...conversationHistory, nextHistoryMessage].slice(-MAX_HISTORY_MESSAGES);

    setMessages((current) => [...current, nextUserMessage]);
    setDraft('');

    try {
      const response = await copilotMutation.mutateAsync({
        message: trimmedInput,
        history: nextHistory.slice(0, -1),
      });

      setMessages((current) => [...current, createMessage('assistant', response.message)]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        createMessage('assistant', getApiErrorMessage(error), 'error'),
      ]);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(draft);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="w-[calc(100vw-2rem)] max-w-[26rem] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
          <div className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.28),transparent_60%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
                  <Sparkles size={14} />
                  Fleet Copilot
                </div>
                <p className="mt-2 text-sm text-slate-200">Read-only analytics assistant grounded in your live dashboard data.</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI copilot"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div ref={scrollContainerRef} className="max-h-[28rem] space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                  onClick={() => void submitMessage(prompt)}
                  disabled={copilotMutation.isPending}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-sky-600 text-white'
                      : message.tone === 'error'
                        ? 'border border-rose-200 bg-rose-50 text-rose-700'
                        : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {copilotMutation.isPending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <LoaderCircle size={16} className="animate-spin" />
                  Thinking over current analytics...
                </div>
              </div>
            ) : null}
          </div>

          <form className="border-t border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="ai-copilot-input">Ask Fleet Copilot</label>
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <textarea
                  id="ai-copilot-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask about dashboard risk, alerts, telemetry, or driver insights..."
                  rows={2}
                  maxLength={1000}
                  className="max-h-32 min-h-[3rem] w-full resize-none border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  disabled={copilotMutation.isPending}
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={copilotMutation.isPending || draft.trim().length < 2}
                aria-label="Send message"
              >
                <SendHorizontal size={18} />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">This copilot answers from supported live analytics only.</p>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="group flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-xl shadow-slate-950/10 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI copilot"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:bg-sky-600">
          {isOpen ? <Bot size={18} /> : <MessageSquareText size={18} />}
        </span>
        <span className="hidden pr-1 sm:inline">Ask Fleet Copilot</span>
      </button>
    </div>
  );
}
