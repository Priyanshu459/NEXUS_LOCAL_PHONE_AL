import type { LlamaContext } from 'llama.rn';
import {
  formatMessagesForModel,
  ChatFormattingOptions,
} from './chatFormatting';

// Remove whole oldest turns from inference only; saved conversations remain intact.
export async function fitContext(
  llama: LlamaContext,
  options: ChatFormattingOptions,
  contextSize: number,
  maxTokens: number,
) {
  let messages = [...options.messages];
  let removedMessages = 0;
  let webSources = options.webSources?.map(s => ({...s}));
  const reserve = Math.min(maxTokens, Math.floor(contextSize / 2));
  while (true) {
    const formatted = await formatMessagesForModel(llama, {
      ...options,
      messages,
      webSources,
    });
    const count = (await llama.tokenize(formatted.prompt)).tokens.length;
    if (count + reserve + 64 <= contextSize) {
      return {
        ...formatted,
        nPredict: Math.min(maxTokens, contextSize - count - 64),
        removedMessages,
        webSources,
      };
    }
    const nextUser = messages.findIndex((m, i) => i > 0 && m.role === 'user');
    if (nextUser < 0) {
      if (webSources?.some(s => s.snippet.length > 90)) {
        webSources = webSources.map(s => ({...s, snippet:s.snippet.slice(0,90)}));
        continue;
      }
      if (webSources && webSources.length > 1) {webSources = webSources.slice(0,-1); continue;}
      throw new Error(
        'This message or attachment is too large for the model. Shorten it, or reduce the system prompt and saved memories in Settings.',
      );
    }
    removedMessages += nextUser;
    messages = messages.slice(nextUser);
  }
}
