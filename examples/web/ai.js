// examples/web/ai.js
// AI Mascot Generator - Groq + Ollama - baked into Open Mascot Studio
// Returns ONLY JSON: { name, shape, color, eyeColor, stageColor, eyeShape, eyeHeight }
// No dependencies, works in browser via fetch.

const ALLOWED_SHAPES = ['soft', 'round', 'compact', 'wide', 'tall', 'large', 'drop', 'robot', 'cat', 'ghost', 'paper']
const ALLOWED_EYE_SHAPES = ['capsule', 'oval']

const SYSTEM_PROMPT = `You are a mascot designer for Open Mascot Studio, a 2D vector blob mascot engine.
Return ONLY valid JSON, no markdown, no explanation, no extra text.

JSON format:
{
  "name": "ShortName",
  "shape": "one of soft, round, compact, wide, tall, large, drop, robot, cat, ghost, paper",
  "color": "#RRGGBB blob color",
  "eyeColor": "#RRGGBB eye color",
  "stageColor": "#RRGGBB dark background color",
  "eyeShape": "capsule or oval",
  "eyeHeight": 50
}

Rules:
- eyeHeight: 50 = normal, 28-32 = narrowed / evil / villain grin, 36-38 = grumpy / crossed-arms guardian, 44-52 = big angry monster eyes.
- stageColor should be a dark version of the blob color, for contrast.
- eyeColor should contrast with blob color. Dark blob = light eyes, light blob = dark eyes.

STYLE MAPPING - use these exactly when user asks for them:

LLM Mascots:
- robot / Bolt -> shape robot, color #8AA8FF, eyeColor #1E3A8A, stageColor #0F172A, eyeHeight 50
- cat / Nyan -> shape cat, color #FFB6D9, eyeColor #111827, stageColor #1F1D2B
- ghost / Ghosty -> shape ghost, color #E0E7FF, eyeColor #111827, stageColor #111827
- paper / Clippy -> shape paper, color #FEF08A, eyeColor #111827, stageColor #422006
- dark / voidling -> shape tall, color #111827, eyeColor #F472B6, stageColor #000000

GRUMPY ANIMAL GUARDIANS - all grumpy, eyeHeight 36-38:
- bear -> shape large, color #6B4A2F, eyeColor #111111, stageColor #1A1210
- fox -> shape tall, color #FF7F3F, eyeColor #111111, stageColor #1F140F
- gorilla -> shape large, color #4A4A4A, eyeColor #FACC15, stageColor #0F0F0F
- bull -> shape wide, color #7C2D12, eyeColor #111111, stageColor #1A0F0A
- pig -> shape round, color #E8A0A0, eyeColor #111111, stageColor #201515
- skunk -> shape compact, color #181818, eyeColor #FFFFFF, stageColor #111111
- cheetah -> shape tall, color #E8A020, eyeColor #111111, stageColor #1A1405
- donkey -> shape tall, color #8A8A8A, eyeColor #111111, stageColor #141414

CUTE EVIL PETS - all cute-but-evil, narrowed eyes, eyeHeight 28-30:
- evil cat -> shape cat, color #FF9A3C, eyeColor #7C2D12, stageColor #1F0F05, eyeHeight 28
- evil dog / rottweiler -> shape round, color #2B2B2B, eyeColor #FACC15, stageColor #0F0F0F, eyeHeight 28
- evil hamster -> shape round, color #D9A066, eyeColor #111111, stageColor #1A120A, eyeHeight 30
- any "evil", "villain", "grinch", "mischievous" pet -> use eyeHeight 28-30

GRUMPY MONSTER:
- monster / green monster / grumpy monster -> shape wide, color #4CAF50, eyeColor #111111, stageColor #0F1A0F, eyeHeight 44, eyeShape capsule

General:
- If user says "grumpy", use eyeHeight 38 and darker colors.
- If user says "cute", use round or soft shape and pastel color.
- If user says "neon / cyberpunk / dark mode", use dark stageColor #0F172A or #000000 and bright blob color.
- Keep name short, 1-2 words, no spaces in shape, no emoji.
- Never invent a shape outside the allowed list. Map animals to closest shape: bear=large, fox=tall, bull=wide, pig=round, skunk=compact.
`

// Strip markdown fences and extract JSON
function cleanJson(text) {
  if (!text) throw new Error('Empty response from AI')
  let cleaned = String(text).trim()
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim()
  // Find first { to last }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1)
  return cleaned
}

function isHex(color) {
  return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color.trim())
}

function normalizePreset(parsed, fallbackPrompt = '') {
  const fallback = {
    name: 'Mallow',
    shape: 'soft',
    color: '#e98263',
    eyeColor: '#3a1e17',
    stageColor: '#111820',
    eyeShape: 'capsule',
    eyeHeight: 50,
  }
  if (!parsed || typeof parsed !== 'object') return fallback

  // Map synonyms to allowed shapes
  const shapeMap = {
    bear: 'large', grizzly: 'large', gorilla: 'large',
    fox: 'tall', cheetah: 'tall', donkey: 'tall', giraffe: 'tall',
    bull: 'wide', monster: 'wide',
    pig: 'round', dog: 'round', hamster: 'round',
    skunk: 'compact',
    robot: 'robot', cat: 'cat', ghost: 'ghost', paper: 'paper',
  }
  let shape = String(parsed.shape || fallback.shape).toLowerCase().trim()
  if (!ALLOWED_SHAPES.includes(shape) && shapeMap[shape]) shape = shapeMap[shape]
  if (!ALLOWED_SHAPES.includes(shape)) shape = fallback.shape

  let eyeHeight = Number(parsed.eyeHeight)
  if (!Number.isFinite(eyeHeight)) eyeHeight = fallback.eyeHeight
  eyeHeight = Math.max(25, Math.min(72, Math.round(eyeHeight)))

  return {
    name: String(parsed.name || fallbackPrompt.slice(0, 20) || fallback.name).slice(0, 24) || fallback.name,
    shape,
    color: isHex(parsed.color) ? parsed.color : fallback.color,
    eyeColor: isHex(parsed.eyeColor) ? parsed.eyeColor : fallback.eyeColor,
    stageColor: isHex(parsed.stageColor) ? parsed.stageColor : fallback.stageColor,
    eyeShape: ALLOWED_EYE_SHAPES.includes(parsed.eyeShape) ? parsed.eyeShape : fallback.eyeShape,
    eyeHeight,
  }
}

// Local keyword fallback if AI is down - matches your Animal Presets
function guessFromKeywords(prompt) {
  const p = String(prompt || '').toLowerCase()
  const has = (...words) => words.some(w => p.includes(w))
  if (has('bear', 'grizzly')) return { name: 'Bear', shape: 'large', color: '#6B4A2F', eyeColor: '#111111', stageColor: '#1A1210', eyeShape: 'capsule', eyeHeight: 38 }
  if (has('fox')) return { name: 'Fox', shape: 'tall', color: '#FF7F3F', eyeColor: '#111111', stageColor: '#1F140F', eyeShape: 'capsule', eyeHeight: 38 }
  if (has('gorilla', 'ape', 'kong')) return { name: 'Gorilla', shape: 'large', color: '#4A4A4A', eyeColor: '#FACC15', stageColor: '#0F0F0F', eyeShape: 'capsule', eyeHeight: 36 }
  if (has('bull', 'cow', 'bison')) return { name: 'Bull', shape: 'wide', color: '#7C2D12', eyeColor: '#111111', stageColor: '#1A0F0A', eyeShape: 'capsule', eyeHeight: 38 }
  if (has('pig', 'pork')) return { name: 'Pig', shape: 'round', color: '#E8A0A0', eyeColor: '#111111', stageColor: '#201515', eyeShape: 'capsule', eyeHeight: 38 }
  if (has('skunk')) return { name: 'Skunk', shape: 'compact', color: '#181818', eyeColor: '#FFFFFF', stageColor: '#111111', eyeShape: 'capsule', eyeHeight: 38 }
  if (has('cheetah', 'leopard', 'tiger')) return { name: 'Cheetah', shape: 'tall', color: '#E8A020', eyeColor: '#111111', stageColor: '#1A1405', eyeShape: 'capsule', eyeHeight: 36 }
  if (has('donkey', 'mule')) return { name: 'Donkey', shape: 'tall', color: '#8A8A8A', eyeColor: '#111111', stageColor: '#141414', eyeShape: 'capsule', eyeHeight: 38 }
  if (has('evil cat', 'villain cat')) return { name: 'Evil Cat', shape: 'cat', color: '#FF9A3C', eyeColor: '#7C2D12', stageColor: '#1F0F05', eyeShape: 'capsule', eyeHeight: 28 }
  if (has('evil dog', 'rottweiler')) return { name: 'Evil Dog', shape: 'round', color: '#2B2B2B', eyeColor: '#FACC15', stageColor: '#0F0F0F', eyeShape: 'capsule', eyeHeight: 28 }
  if (has('evil hamster', 'hamster')) return { name: 'Evil Hamster', shape: 'round', color: '#D9A066', eyeColor: '#111111', stageColor: '#1A120A', eyeShape: 'capsule', eyeHeight: 30 }
  if (has('monster', 'ogre', 'goblin')) return { name: 'Monster', shape: 'wide', color: '#4CAF50', eyeColor: '#111111', stageColor: '#0F1A0F', eyeShape: 'capsule', eyeHeight: 44 }
  if (has('robot', 'bolt', 'ai assistant')) return { name: 'Bolt', shape: 'robot', color: '#8AA8FF', eyeColor: '#1E3A8A', stageColor: '#0F172A', eyeShape: 'capsule', eyeHeight: 50 }
  if (has('ghost')) return { name: 'Ghosty', shape: 'ghost', color: '#E0E7FF', eyeColor: '#111827', stageColor: '#111827', eyeShape: 'capsule', eyeHeight: 50 }
  if (has('clippy', 'paper')) return { name: 'Clippy', shape: 'paper', color: '#FEF08A', eyeColor: '#111827', stageColor: '#422006', eyeShape: 'capsule', eyeHeight: 50 }
  if (has('cat', 'nyan', 'kitty')) return { name: 'Nyan', shape: 'cat', color: '#FFB6D9', eyeColor: '#111827', stageColor: '#1F1D2B', eyeShape: 'capsule', eyeHeight: 50 }
  return null
}

export async function generateWithGroq(userPrompt, apiKey, model = 'llama-3.3-70b-versatile') {
  if (!apiKey) throw new Error('Missing Groq API key. Paste it in Settings (console.groq.com)')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Create a mascot for: ${userPrompt}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
      max_tokens: 400,
    }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Groq error ${res.status}: ${err.slice(0, 200) || res.statusText}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Groq returned no content')
  const parsed = JSON.parse(cleanJson(content))
  return normalizePreset(parsed, userPrompt)
}

export async function generateWithOllama(userPrompt, url = 'http://localhost:11434', model = 'llama3.2') {
  const base = String(url || 'http://localhost:11434').replace(/\/$/, '')
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Create a mascot for: ${userPrompt}` },
      ],
      stream: false,
      // Ask Ollama for JSON mode when supported
      format: 'json',
      options: { temperature: 0.9 },
    }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Ollama error ${res.status}: ${err.slice(0, 200) || 'Is ollama serve running? Try OLLAMA_ORIGINS=* ollama serve'}`)
  }
  const data = await res.json()
  const content = data?.message?.content || data?.response || ''
  if (!content) throw new Error('Ollama returned no content')
  const parsed = JSON.parse(cleanJson(content))
  return normalizePreset(parsed, userPrompt)
}

// Main entry used by demo.js
export async function generateMascotFromPrompt(userPrompt, provider = 'groq', config = {}) {
  const prompt = String(userPrompt || '').trim()
  if (!prompt) throw new Error('Type a description first')

  const groqKey = config.groqKey || localStorage.getItem('groq-api-key') || ''
  const groqModel = config.groqModel || 'llama-3.3-70b-versatile'
  const ollamaUrl = config.ollamaUrl || localStorage.getItem('ollama-url') || 'http://localhost:11434'
  const ollamaModel = config.ollamaModel || localStorage.getItem('ollama-model') || 'llama3.2'

  try {
    if (provider === 'ollama') {
      return await generateWithOllama(prompt, ollamaUrl, ollamaModel)
    }
    // default groq
    return await generateWithGroq(prompt, groqKey, groqModel)
  } catch (err) {
    console.warn('AI generation failed, trying keyword fallback', err)
    const fallback = guessFromKeywords(prompt)
    if (fallback) return fallback
    throw err
  }
}

// Settings helpers - stored in localStorage only, never sent anywhere except Groq / localhost
export function getAISettings() {
  return {
    provider: localStorage.getItem('ai-provider') || 'groq',
    groqKey: localStorage.getItem('groq-api-key') || '',
    ollamaUrl: localStorage.getItem('ollama-url') || 'http://localhost:11434',
    ollamaModel: localStorage.getItem('ollama-model') || 'llama3.2',
  }
}

export function saveAISettings({ provider, groqKey, ollamaUrl, ollamaModel } = {}) {
  if (provider) localStorage.setItem('ai-provider', provider)
  if (groqKey !== undefined) localStorage.setItem('groq-api-key', groqKey)
  if (ollamaUrl) localStorage.setItem('ollama-url', ollamaUrl)
  if (ollamaModel) localStorage.setItem('ollama-model', ollamaModel)
  return getAISettings()
}

export function getAIProvider() {
  return localStorage.getItem('ai-provider') || 'groq'
}
