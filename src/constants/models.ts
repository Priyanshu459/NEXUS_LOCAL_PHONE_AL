export const AVAILABLE_MODELS = [
  {
    id: "llama32-1b",
    name: "Llama 3.2 1B",
    desc: "Extremely fast, very capable. Perfect for older devices and rapid on-device prototyping.",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    color: '#4285F4',
    size: "1.3 GB",
    provider: "Meta AI",
    badge: "⚡ Ultralight",
    tags: ["45+ TPS", "4-bit Quant", "Low RAM"]
  },
  {
    id: "qwen25-15b",
    name: "Qwen 2.5 1.5B",
    desc: "Unbeatable reasoning and math accuracy for its compact size. Lightning fast response time.",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    color: '#A142F4',
    size: "1.1 GB",
    provider: "Alibaba",
    badge: "🧠 Top Reasoning",
    tags: ["50+ TPS", "Math & Logic", "Q4_K_M"]
  },
  {
    id: "llama32-3b",
    name: "Llama 3.2 3B",
    desc: "The sweet spot of general intelligence and generation speed for daily conversational tasks.",
    url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    color: '#1A73E8',
    size: "2.1 GB",
    provider: "Meta AI",
    badge: "⭐ Recommended",
    tags: ["32 TPS", "High Accuracy", "3B Params"]
  },
  {
    id: "deepseek-15b",
    name: "DeepSeek R1 1.5B",
    desc: "Distilled reasoning architecture. Formulates internal thought chains before answering.",
    url: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
    color: '#FBBC04',
    size: "1.1 GB",
    provider: "DeepSeek",
    badge: "👁️ Deep Thought",
    tags: ["CoT Reasoning", "Distilled", "1.5B"]
  },
  {
    id: "gemma2-2b",
    name: "Gemma 2 2B",
    desc: "Lightweight but punchy neural architecture designed for on-device semantic understanding.",
    url: "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf",
    color: '#00F2FE',
    size: "1.6 GB",
    provider: "Neural Arch",
    badge: "💠 Quantum Core",
    tags: ["Official Arch", "38 TPS", "2B Params"]
  },
  {
    id: "phi3-mini",
    name: "Phi-3 Mini 3.8B",
    desc: "Microsoft's small model that hits way above its weight class with rich contextual memory.",
    url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
    color: '#00A4EF',
    size: "2.4 GB",
    provider: "Microsoft",
    badge: "🏢 Enterprise",
    tags: ["4K Context", "Dense", "Q4 Quant"]
  }
];
