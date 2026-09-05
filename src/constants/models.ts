export interface ModelMetadata {
  id: string;
  name: string;
  desc: string;
  url: string;
  color: string;
  size: string;
  expectedSizeBytes?: number;
  sha256?: string;
  provider: string;
  badge: string;
  tags: string[];
  
  originalPublisher: string;
  quantizationPublisher: string;
  originalModelUrl: string;
  quantizedRepoUrl: string;
  licenseIdentifier: string;
  licenseUrl: string;
  isLicenseVerified: boolean;
}

export const AVAILABLE_MODELS: ModelMetadata[] = [
  {
    id: 'llama32-1b',
    name: 'Llama 3.2 1B',
    desc: 'Compact GGUF model for quick on-device chat on a wide range of Android devices.',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/e1d3e8e/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    color: '#4285F4',
    size: '807 MB',
    expectedSizeBytes: 807694464,
    provider: 'Meta AI',
    badge: 'Lightweight',
    tags: ['GGUF', '4-bit quant', 'Lower RAM'],
    originalPublisher: 'Meta AI',
    quantizationPublisher: 'bartowski',
    originalModelUrl: 'https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct',
    quantizedRepoUrl: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF',
    licenseIdentifier: 'Llama 3.2 Community License',
    licenseUrl: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE',
    isLicenseVerified: false
  },
  {
    id: 'qwen25-15b',
    name: 'Qwen 2.5 1.5B',
    desc: 'Small instruction model with a practical balance of reasoning quality and phone-friendly size.',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    color: '#A142F4',
    size: '1.1 GB',
    expectedSizeBytes: 1117320736,
    provider: 'Alibaba',
    badge: 'Compact',
    tags: ['GGUF', 'Reasoning', 'Q4_K_M'],
    originalPublisher: 'Alibaba Cloud',
    quantizationPublisher: 'Qwen',
    originalModelUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct',
    quantizedRepoUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF',
    licenseIdentifier: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    isLicenseVerified: true
  },
  {
    id: 'llama32-3b',
    name: 'Llama 3.2 3B',
    desc: 'General-purpose local chat model for newer devices with enough free storage and memory.',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    color: '#1A73E8',
    size: '2.0 GB',
    expectedSizeBytes: 2019377696,
    provider: 'Meta AI',
    badge: 'Recommended',
    tags: ['GGUF', 'General chat', '3B params'],
    originalPublisher: 'Meta AI',
    quantizationPublisher: 'bartowski',
    originalModelUrl: 'https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct',
    quantizedRepoUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF',
    licenseIdentifier: 'Llama 3.2 Community License',
    licenseUrl: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE',
    isLicenseVerified: false
  },
  {
    id: 'deepseek-15b',
    name: 'DeepSeek R1 1.5B',
    desc: 'Reasoning-focused distilled model. Output style and speed depend on device and prompt.',
    url: 'https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    color: '#FBBC04',
    size: '1.1 GB',
    expectedSizeBytes: 1117321312,
    provider: 'DeepSeek',
    badge: 'Reasoning',
    tags: ['GGUF', 'Distilled', '1.5B'],
    originalPublisher: 'DeepSeek',
    quantizationPublisher: 'unsloth',
    originalModelUrl: 'https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
    quantizedRepoUrl: 'https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF',
    licenseIdentifier: 'MIT',
    licenseUrl: 'https://opensource.org/licenses/MIT',
    isLicenseVerified: true
  },
  {
    id: 'gemma2-2b',
    name: 'Gemma 2 2B',
    desc: 'Lightweight instruction model for local text chat and summarization-style prompts.',
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    color: '#00F2FE',
    size: '1.7 GB',
    expectedSizeBytes: 1708582752,
    provider: 'Google',
    badge: 'Small',
    tags: ['GGUF', 'Instruction tuned', '2B params'],
    originalPublisher: 'Google',
    quantizationPublisher: 'bartowski',
    originalModelUrl: 'https://huggingface.co/google/gemma-2-2b-it',
    quantizedRepoUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF',
    licenseIdentifier: 'Gemma License',
    licenseUrl: 'https://ai.google.dev/gemma/terms',
    isLicenseVerified: false
  },
  {
    id: 'phi3-mini',
    name: 'Phi-3 Mini 3.8B',
    desc: 'Microsoft small language model for local instruction following on capable devices.',
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    color: '#00A4EF',
    size: '2.4 GB',
    expectedSizeBytes: 2393231072,
    provider: 'Microsoft',
    badge: 'Capable',
    tags: ['GGUF', '4K context', 'Q4 quant'],
    originalPublisher: 'Microsoft',
    quantizationPublisher: 'microsoft',
    originalModelUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct',
    quantizedRepoUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf',
    licenseIdentifier: 'MIT',
    licenseUrl: 'https://opensource.org/licenses/MIT',
    isLicenseVerified: true
  }
];
