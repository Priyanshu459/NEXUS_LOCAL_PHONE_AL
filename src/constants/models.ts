export const AVAILABLE_MODELS = [
  {
    id: "llama32-1b",
    name: "Llama 3.2 1B",
    desc: "Compact GGUF model for quick on-device chat on a wide range of Android devices.",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    color: '#4285F4',
    size: "1.3 GB",
    provider: "Meta AI",
    badge: "Lightweight",
    tags: ["GGUF", "4-bit quant", "Lower RAM"]
  },
  {
    id: "qwen25-15b",
    name: "Qwen 2.5 1.5B",
    desc: "Small instruction model with a practical balance of reasoning quality and phone-friendly size.",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    color: '#A142F4',
    size: "1.1 GB",
    provider: "Alibaba",
    badge: "Compact",
    tags: ["GGUF", "Reasoning", "Q4_K_M"]
  },
  {
    id: "llama32-3b",
    name: "Llama 3.2 3B",
    desc: "General-purpose local chat model for newer devices with enough free storage and memory.",
    url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    color: '#1A73E8',
    size: "2.1 GB",
    provider: "Meta AI",
    badge: "Recommended",
    tags: ["GGUF", "General chat", "3B params"]
  },
  {
    id: "deepseek-15b",
    name: "DeepSeek R1 1.5B",
    desc: "Reasoning-focused distilled model. Output style and speed depend on device and prompt.",
    url: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
    color: '#FBBC04',
    size: "1.1 GB",
    provider: "DeepSeek",
    badge: "Reasoning",
    tags: ["GGUF", "Distilled", "1.5B"]
  },
  {
    id: "gemma2-2b",
    name: "Gemma 2 2B",
    desc: "Lightweight instruction model for local text chat and summarization-style prompts.",
    url: "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf",
    color: '#00F2FE',
    size: "1.6 GB",
    provider: "Google",
    badge: "Small",
    tags: ["GGUF", "Instruction tuned", "2B params"]
  },
  {
    id: "phi3-mini",
    name: "Phi-3 Mini 3.8B",
    desc: "Microsoft small language model for local instruction following on capable devices.",
    url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
    color: '#00A4EF',
    size: "2.4 GB",
    provider: "Microsoft",
    badge: "Capable",
    tags: ["GGUF", "4K context", "Q4 quant"]
  }
];
