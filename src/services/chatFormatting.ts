import type { LlamaContext } from 'llama.rn';
import { AVAILABLE_MODELS } from '../constants/models';
import { PersistedMessage } from './storage';

export interface ChatFormattingOptions {
  messages: PersistedMessage[];
  systemPrompt: string;
  memoryContextString: string;
  currentAttachmentText?: string;
  modelUrl: string;
}

export interface ChatFormattingResult {
  prompt: string;
  additionalStops: string[];
  formattingMode: 'native' | 'fallback';
}

export async function formatMessagesForModel(
  llama: LlamaContext,
  options: ChatFormattingOptions,
): Promise<ChatFormattingResult> {
  const { messages, systemPrompt, memoryContextString, currentAttachmentText, modelUrl } = options;

  const catalogModel = AVAILABLE_MODELS.find(m => m.url === modelUrl);
  const isDeepSeek = catalogModel?.id.includes('deepseek');
  const isGemma = catalogModel?.id.includes('gemma'); // Gemma rejects system role

  // Construct context string
  let contextStr = systemPrompt;
  if (memoryContextString) {
    contextStr += `\n\n<MEMORY>\n${memoryContextString}\n</MEMORY>`;
  }

  // Handle Gemma template restriction
  const formattingMessages: { role: string; content: string }[] = [];
  
  if (isGemma) {
    // If Gemma, we prepend system to the first user message
    messages.forEach((msg, idx) => {
      let content = msg.content;
      if (idx === 0 && msg.role === 'user') {
        content = `${contextStr}\n\n${content}`;
      }
      formattingMessages.push({ role: msg.role, content });
    });
    // If no messages yet, just add a dummy user message or omit
    if (formattingMessages.length === 0) {
      formattingMessages.push({ role: 'user', content: contextStr });
    }
  } else {
    // Standard system message
    formattingMessages.push({ role: 'system', content: contextStr });
    messages.forEach(msg => {
      formattingMessages.push({ role: msg.role, content: msg.content });
    });
  }

  // Inject ephemeral attachment into the LAST user message if present
  if (currentAttachmentText && formattingMessages.length > 0) {
    // Find the last user message
    let lastUserIndex = -1;
    for (let i = formattingMessages.length - 1; i >= 0; i--) {
      if (formattingMessages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    
    if (lastUserIndex !== -1) {
      const original = formattingMessages[lastUserIndex].content;
      formattingMessages[lastUserIndex].content = `[Attached Document]\n${currentAttachmentText}\n\n${original}`;
    }
  }

  try {
    const formatted = await llama.getFormattedChat(formattingMessages, null, {
      add_generation_prompt: true,
    });

    let finalPrompt = typeof formatted === 'string' ? formatted : formatted.prompt;
    const additionalStops = typeof formatted === 'string' ? [] : (('additional_stops' in formatted ? formatted.additional_stops : []) || []);

    if (isDeepSeek && !finalPrompt.endsWith('<|im_start|>assistant\n')) {
      finalPrompt += '<|im_start|>assistant\n';
    }

    return {
      prompt: finalPrompt,
      additionalStops,
      formattingMode: 'native',
    };
  } catch (error: any) {
    // "handle models rejecting system roles through explicit catalog policy, not brittle inspection of an exception string"
    // "unknown custom models without a usable embedded template must fail clearly"
    // "do not silently fall back to ChatML"
    throw new Error(`Model template error: Failed to format chat. Ensure the model supports the required roles and has a valid embedded template. Details: ${error?.message}`);
  }
}
