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

export const MODEL_CATALOG: ModelMetadata[] = [
  {
    id: 'moonlight-v7', name: 'Moonlight Qwen3 4B v7',
    desc: 'Moonlight’s own model for English and Hinglish. Suggested on phones with sufficient available memory; performance varies by device.',
    url: 'https://huggingface.co/moonlight-labs/moonlight-qwen3-4b-v7/resolve/a83684b2b8251fd4c11d0beb379111cdc19e64c4/moonlight-qwen3-v7-q8_0.gguf',
    sha256: '589133dca71f85d52c13311d282015aa7fa3922458f5d3732ae5b8c64f9c816a',
    color: '#234737', size: '4.28 GB', expectedSizeBytes: 4280400608,
    provider: 'Moonlight Labs', badge: 'Moonlight', tags: ['GGUF', 'Q8_0', 'Higher RAM'],
    originalPublisher: 'Qwen / Alibaba Cloud', quantizationPublisher: 'Moonlight Labs',
    originalModelUrl: 'https://huggingface.co/Qwen/Qwen3-4B',
    quantizedRepoUrl: 'https://huggingface.co/moonlight-labs/moonlight-qwen3-4b-v7',
    licenseIdentifier: 'Apache 2.0', licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0', isLicenseVerified: true,
  },
  {
    id: 'llama32-1b',
    name: 'Llama 3.2 1B',
    desc: 'Compact GGUF model for quick on-device chat on a wide range of Android devices.',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/067b946cf014b7c697f3654f621d577a3e3afd1c/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    sha256: '6f85a640a97cf2bf5b8e764087b1e83da0fdb51d7c9fab7d0fece9385611df83',
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

// Official publisher files, pinned to verified revisions and SHA-256 hashes.
const lfm = (id:string, name:string, repo:string, revision:string, file:string, bytes:number, sha256:string, desc:string):ModelMetadata => ({
  id,name,desc,provider:'Liquid AI',badge:'On this phone',tags:['GGUF','Q4_K_M','Text chat'],
  url:`https://huggingface.co/LiquidAI/${repo}/resolve/${revision}/${file}`,expectedSizeBytes:bytes,sha256,
  size:`${Math.round(bytes/1000000)} MB`,color:'#075DE1',originalPublisher:'Liquid AI',quantizationPublisher:'Liquid AI',
  originalModelUrl:`https://huggingface.co/LiquidAI/${repo.replace('-GGUF','')}`,
  quantizedRepoUrl:`https://huggingface.co/LiquidAI/${repo}`,licenseIdentifier:'LFM Open License 1.0',
  licenseUrl:`https://huggingface.co/LiquidAI/${repo}/blob/${revision}/LICENSE`,isLicenseVerified:true,
});
export const AVAILABLE_MODELS:ModelMetadata[] = [
  lfm('lfm2-350m','LFM2 350M','LFM2-350M-GGUF','8fdc9d526b7ed346b19257551b05816c7912ecc2','LFM2-350M-Q4_K_M.gguf',229309376,'a4d000c7064bd3b2e42c6845836286a899a4e79cf1791da1a6797b58d575957d','The smallest download. A starting point for simple on-device conversations.'),
  lfm('lfm2-700m','LFM2 700M','LFM2-700M-GGUF','fd39e80d7a5ac61494ffff577e61bbbfddbd0d02','LFM2-700M-Q4_K_M.gguf',468624320,'684e8406dc13321452b3f6aeca432776e2a6a7e1ad6c23f7887b8fe3efbe2efa','A compact option for everyday writing, questions and summaries.'),
  lfm('lfm25-12b','LFM2.5 1.2B Instruct','LFM2.5-1.2B-Instruct-GGUF','6767265158422fb8a19c62ceb45f16f05363615b','LFM2.5-1.2B-Instruct-Q4_K_M.gguf',730895168,'b1b3de114215d9507409a662a501a631095a479a419584e8a2ded6304b19b4f5','Instruction-tuned local chat with a larger memory requirement.'),
];
// Legacy metadata stays available for attribution and existing installations.
MODEL_CATALOG.push(...AVAILABLE_MODELS);
