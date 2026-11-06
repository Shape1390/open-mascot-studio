// packages/open-mascot/src/definition.js
// Core mascot definition - 15 expressions, 11 motions, LLM + Animal presets
// Eye shapes: capsule, oval, led, star, round, dot

import { getBlobPreset, listBlobShapes } from './shapes.js'

export const MASCOT_SCHEMA_VERSION = 2

export const MASCOT_SCHEMA = {
  version: MASCOT_SCHEMA_VERSION,
  type: 'open-mascot-definition',
  blob: { shape: 'string', width: 'number', height: 'number', color: 'string', renderMode: 'string' },
  face: { eyeColor: 'string', eyeShape: 'string', eyeWidth: 'number', eyeHeight: 'number', eyeGap: 'number', eyeY: 'number' },
  stage: { color: 'string' },
  expressions: 'object',
  animations: 'object',
}

export const ALLOWED_EYE_SHAPES = ['capsule', 'oval', 'led', 'star', 'round', 'dot']
export const ALLOWED_RENDER_MODES = ['projected-3d', 'rigged-2d']

export function createPose(overrides = {}) {
  const base = {
    blob: { pitch: 0, yaw: 0, roll: 0, squash: 0, lift: 0 },
    gaze: { x: 0, y: 0 },
    eyes: {
      left: { scaleX: 1, scaleY: 1, x: 0, y: 0, rotation: 0 },
      right: { scaleX: 1, scaleY: 1, x: 0, y: 0, rotation: 0 },
    },
  }
  // Deep merge overrides
  if (overrides.blob) Object.assign(base.blob, overrides.blob)
  if (overrides.gaze) Object.assign(base.gaze, overrides.gaze)
  if (overrides.eyes?.left) Object.assign(base.eyes.left, overrides.eyes.left)
  if (overrides.eyes?.right) Object.assign(base.eyes.right, overrides.eyes.right)
  return base
}

function makeExpression(label, poseOverrides = {}, motion = { body: 'none', eyes: 'none' }) {
  return { label, pose: createPose(poseOverrides), motion }
}

// --- 15 EXPRESSIONS ---
export const DEFAULT_EXPRESSIONS = {
  neutral: makeExpression('Neutral', {}),
  focused: makeExpression('Focused', { blob: { pitch: -2 }, gaze: { y: -2 }, eyes: { left: { scaleY: 0.9 }, right: { scaleY: 0.9 } } }, { body: 'none', eyes: 'micro-saccades' }),
  curious: makeExpression('Curious', { blob: { yaw: 6, pitch: -4 }, gaze: { x: 4 }, eyes: { left: { scaleX: 1.1 }, right: { scaleX: 1.1 } } }),
  skyward: makeExpression('Skyward', { blob: { pitch: -12 }, gaze: { y: -10 } }),
  'soft-gaze': makeExpression('Soft Gaze', { blob: { pitch: 4 }, gaze: { y: 3 }, eyes: { left: { scaleY: 0.8 }, right: { scaleY: 0.8 } } }, { body: 'slow-drift', eyes: 'none' }),
  'side-eye': makeExpression('Side Eye', { blob: { yaw: 8 }, gaze: { x: 12 } }),
  beaming: makeExpression('Beaming', { blob: { squash: 0.02, lift: 2 }, gaze: { y: -2 }, eyes: { left: { scaleY: 0.6, scaleX: 1.1 }, right: { scaleY: 0.6, scaleX: 1.1 } } }, { body: 'boing', eyes: 'none' }),
  cheeky: makeExpression('Cheeky', { blob: { roll: 6 }, gaze: { x: 6 }, eyes: { left: { scaleY: 0.3 }, right: { scaleY: 0.9 } } }),
  angry: makeExpression('Angry', { blob: { pitch: 4, squash: -0.02 }, gaze: { y: 2 }, eyes: { left: { scaleY: 0.6, rotation: -12 }, right: { scaleY: 0.6, rotation: 12 } } }, { body: 'tremble', eyes: 'tremble' }),
  uneasy: makeExpression('Uneasy', { blob: { yaw: -6, roll: -4 }, gaze: { x: -6 }, eyes: { left: { scaleX: 0.9 }, right: { scaleX: 0.9 } } }),
  sleepy: makeExpression('Sleepy', { blob: { pitch: 6, lift: -2 }, gaze: { y: 4 }, eyes: { left: { scaleY: 0.35 }, right: { scaleY: 0.35 } } }, { body: 'slow-drift', eyes: 'none' }),
  surprised: makeExpression('Surprised', { blob: { squash: 0.04 }, gaze: { y: -4 }, eyes: { left: { scaleX: 1.2, scaleY: 1.2 }, right: { scaleX: 1.2, scaleY: 1.2 } } }),
  worried: makeExpression('Worried', { blob: { pitch: 3, yaw: -3 }, gaze: { y: 2 }, eyes: { left: { scaleY: 0.9 }, right: { scaleY: 0.9 } } }),
  delighted: makeExpression('Delighted', { blob: { squash: 0.03, lift: 3 }, gaze: { y: -3 }, eyes: { left: { scaleY: 0.5, scaleX: 1.15 }, right: { scaleY: 0.5, scaleX: 1.15 } } }, { body: 'boing', eyes: 'none' }),
  grumpy: makeExpression('Grumpy', { blob: { pitch: 5 }, gaze: { y: 3 }, eyes: { left: { scaleY: 0.55, rotation: -10 }, right: { scaleY: 0.55, rotation: 10 } } }, { body: 'none', eyes: 'none' }),
}

function makeAnimation(label, steps, { playback = 'loop', blink = 'normal', ambient = 0.3 } = {}) {
  return { label, playback, blink, ambient, steps }
}

// --- 11 MOTIONS ---
export const DEFAULT_ANIMATIONS = {
  idle: makeAnimation('Idle', [
    { expression: 'neutral', holdMs: 3000, transitionMs: 800, easing: 'gentle' },
    { expression: 'soft-gaze', holdMs: 2200, transitionMs: 800, easing: 'gentle' },
  ], { ambient: 0.3 }),
  listening: makeAnimation('Listening', [
    { expression: 'neutral', holdMs: 1500, transitionMs: 600, easing: 'gentle' },
    { expression: 'curious', holdMs: 2500, transitionMs: 600, easing: 'gentle' },
    { expression: 'focused', holdMs: 2000, transitionMs: 600, easing: 'gentle' },
  ], { blink: 'calm', ambient: 0.25 }),
  thinking: makeAnimation('Thinking', [
    { expression: 'curious', holdMs: 1800, transitionMs: 700, easing: 'gentle' },
    { expression: 'skyward', holdMs: 2400, transitionMs: 700, easing: 'gentle' },
    { expression: 'focused', holdMs: 1800, transitionMs: 700, easing: 'gentle' },
  ], { ambient: 0.2 }),
  happy: makeAnimation('Happy', [
    { expression: 'beaming', holdMs: 1800, transitionMs: 500, easing: 'spring' },
    { expression: 'delighted', holdMs: 1800, transitionMs: 500, easing: 'spring' },
    { expression: 'beaming', holdMs: 1800, transitionMs: 500, easing: 'spring' },
  ], { blink: 'bright', ambient: 0.4 }),
  curious: makeAnimation('Curious', [
    { expression: 'curious', holdMs: 2200, transitionMs: 600, easing: 'gentle' },
    { expression: 'focused', holdMs: 2000, transitionMs: 600, easing: 'gentle' },
    { expression: 'curious', holdMs: 2200, transitionMs: 600, easing: 'gentle' },
  ]),
  excited: makeAnimation('Excited', [
    { expression: 'surprised', holdMs: 1200, transitionMs: 400, easing: 'spring' },
    { expression: 'beaming', holdMs: 1600, transitionMs: 400, easing: 'spring' },
    { expression: 'delighted', holdMs: 1600, transitionMs: 400, easing: 'spring' },
  ], { blink: 'bright', ambient: 0.5 }),
  sleepy: makeAnimation('Sleepy', [
    { expression: 'sleepy', holdMs: 3200, transitionMs: 900, easing: 'gentle' },
    { expression: 'soft-gaze', holdMs: 2200, transitionMs: 900, easing: 'gentle' },
    { expression: 'sleepy', holdMs: 3200, transitionMs: 900, easing: 'gentle' },
  ], { blink: 'sleepy', ambient: 0.15 }),
  surprised: makeAnimation('Surprised', [
    { expression: 'surprised', holdMs: 1600, transitionMs: 400, easing: 'quick' },
    { expression: 'neutral', holdMs: 2000, transitionMs: 600, easing: 'gentle' },
  ], { ambient: 0.35 }),
  angry: makeAnimation('Angry', [
    { expression: 'angry', holdMs: 2000, transitionMs: 500, easing: 'quick' },
    { expression: 'grumpy', holdMs: 2000, transitionMs: 500, easing: 'gentle' },
    { expression: 'angry', holdMs: 2000, transitionMs: 500, easing: 'quick' },
  ], { ambient: 0.35 }),
  greeting: makeAnimation('Greeting', [
    { expression: 'beaming', holdMs: 1800, transitionMs: 500, easing: 'spring' },
    { expression: 'curious', holdMs: 1800, transitionMs: 500, easing: 'gentle' },
    { expression: 'beaming', holdMs: 1800, transitionMs: 500, easing: 'spring' },
  ], { playback: 'once', ambient: 0.3 }),
  bounce: makeAnimation('Bounce', [
    { expression: 'neutral', holdMs: 1000, transitionMs: 400, easing: 'spring' },
    { expression: 'beaming', holdMs: 1200, transitionMs: 400, easing: 'spring' },
    { expression: 'neutral', holdMs: 1000, transitionMs: 400, easing: 'spring' },
  ], { ambient: 0.45 }),
}

export function cloneDefinition(def) {
  return JSON.parse(JSON.stringify(def))
}

export function createDefinition({
  name = 'Mallow',
  shape = 'soft',
  color = '#e98263',
  eyeColor = '#3a1e17',
  stageColor = '#111820',
  eyeShape = 'capsule',
  renderMode = 'projected-3d',
  eyeHeight = 50,
  eyeWidth = 22,
  eyeGap = 62,
  eyeY = 0,
} = {}) {
  const preset = getBlobPreset(shape)
  const safeShape = listBlobShapes().includes(shape) ? shape : 'soft'
  const safeEyeShape = ALLOWED_EYE_SHAPES.includes(eyeShape) ? eyeShape : 'capsule'
  const safeRender = ALLOWED_RENDER_MODES.includes(renderMode) ? renderMode : 'projected-3d'
  return {
    name: String(name || 'Mallow'),
    blob: {
      shape: safeShape,
      width: preset.width,
      height: preset.height,
      color,
      renderMode: safeRender,
    },
    face: {
      eyeColor,
      eyeShape: safeEyeShape,
      eyeWidth,
      eyeHeight,
      eyeGap,
      eyeY,
    },
    stage: { color: stageColor },
    expressions: cloneDefinition(DEFAULT_EXPRESSIONS),
    animations: cloneDefinition(DEFAULT_ANIMATIONS),
  }
}

export const baseDefinition = createDefinition({})

export function validateDefinition(def) {
  const errors = []
  if (!def || typeof def !== 'object') return { ok: false, errors: ['Definition must be an object'] }
  if (typeof def.name !== 'string' || !def.name.trim()) errors.push('name must be a non-empty string')
  if (!def.blob || !listBlobShapes().includes(def.blob.shape)) errors.push('blob.shape is invalid')
  if (!def.blob?.color || !/^#[0-9A-Fa-f]{6}$/.test(def.blob.color)) errors.push('blob.color must be #RRGGBB')
  if (!def.face?.eyeColor || !/^#[0-9A-Fa-f]{6}$/.test(def.face.eyeColor)) errors.push('face.eyeColor must be #RRGGBB')
  if (!def.stage?.color || !/^#[0-9A-Fa-f]{6}$/.test(def.stage.color)) errors.push('stage.color must be #RRGGBB')
  if (def.face?.eyeShape && !ALLOWED_EYE_SHAPES.includes(def.face.eyeShape)) errors.push('face.eyeShape is invalid')
  if (!def.expressions || !def.expressions.neutral) errors.push('expressions.neutral is required')
  if (!def.animations || Object.keys(def.animations).length === 0) errors.push('at least one animation is required')
  // Check animation steps reference real expressions
  for (const [key, anim] of Object.entries(def.animations || {})) {
    if (!Array.isArray(anim.steps) || anim.steps.length === 0) errors.push(`animations.${key}.steps is empty`)
    for (const step of anim.steps || []) {
      if (!def.expressions[step.expression]) errors.push(`animations.${key} references missing expression ${step.expression}`)
    }
  }
  return { ok: errors.length === 0, errors }
}

// --- LLM MASCOT PRESETS ---
export const LLM_MASCOT_PRESETS = {
  mallow: { name: 'Mallow', shape: 'soft', color: '#e98263', eyeColor: '#3a1e17', stageColor: '#111820', eyeShape: 'capsule', eyeHeight: 50 },
  bolt: { name: 'Bolt', shape: 'robot', color: '#8AA8FF', eyeColor: '#1E3A8A', stageColor: '#0F172A', eyeShape: 'capsule', eyeHeight: 50 },
  nyan: { name: 'Nyan', shape: 'cat', color: '#FFB6D9', eyeColor: '#111827', stageColor: '#1F1D2B', eyeShape: 'capsule', eyeHeight: 50 },
  ghosty: { name: 'Ghosty', shape: 'ghost', color: '#E0E7FF', eyeColor: '#111827', stageColor: '#111827', eyeShape: 'capsule', eyeHeight: 50 },
  clippy: { name: 'Clippy', shape: 'paper', color: '#FEF08A', eyeColor: '#111827', stageColor: '#422006', eyeShape: 'capsule', eyeHeight: 50 },
  voidling: { name: 'Voidling', shape: 'tall', color: '#111827', eyeColor: '#F472B6', stageColor: '#000000', eyeShape: 'capsule', eyeHeight: 50 },
}

export function listLLMStyles() {
  return Object.keys(LLM_MASCOT_PRESETS)
}

export function createLLMMascot(style = 'mallow', overrides = {}) {
  const preset = LLM_MASCOT_PRESETS[style] || LLM_MASCOT_PRESETS.mallow
  return createDefinition({ ...preset, ...overrides })
}

// --- ANIMAL / MONSTER PRESETS ---
export const ANIMAL_MASCOT_PRESETS = {
  bear: { name: 'Bear', shape: 'large', color: '#6B4A2F', eyeColor: '#111111', stageColor: '#1A1210', eyeShape: 'capsule', eyeHeight: 38 },
  fox: { name: 'Fox', shape: 'tall', color: '#FF7F3F', eyeColor: '#111111', stageColor: '#1F140F', eyeShape: 'capsule', eyeHeight: 38 },
  gorilla: { name: 'Gorilla', shape: 'large', color: '#4A4A4A', eyeColor: '#FACC15', stageColor: '#0F0F0F', eyeShape: 'capsule', eyeHeight: 36 },
  bull: { name: 'Bull', shape: 'wide', color: '#7C2D12', eyeColor: '#111111', stageColor: '#1A0F0A', eyeShape: 'capsule', eyeHeight: 38 },
  pig: { name: 'Pig', shape: 'round', color: '#E8A0A0', eyeColor: '#111111', stageColor: '#201515', eyeShape: 'capsule', eyeHeight: 38 },
  skunk: { name: 'Skunk', shape: 'compact', color: '#181818', eyeColor: '#FFFFFF', stageColor: '#111111', eyeShape: 'capsule', eyeHeight: 38 },
  cheetah: { name: 'Cheetah', shape: 'tall', color: '#E8A020', eyeColor: '#111111', stageColor: '#1A1405', eyeShape: 'capsule', eyeHeight: 36 },
  donkey: { name: 'Donkey', shape: 'tall', color: '#8A8A8A', eyeColor: '#111111', stageColor: '#141414', eyeShape: 'capsule', eyeHeight: 38 },
  evilCat: { name: 'Evil Cat', shape: 'cat', color: '#FF9A3C', eyeColor: '#7C2D12', stageColor: '#1F0F05', eyeShape: 'capsule', eyeHeight: 28 },
  evilDog: { name: 'Evil Dog', shape: 'round', color: '#2B2B2B', eyeColor: '#FACC15', stageColor: '#0F0F0F', eyeShape: 'capsule', eyeHeight: 28 },
  evilHamster: { name: 'Evil Hamster', shape: 'round', color: '#D9A066', eyeColor: '#111111', stageColor: '#1A120A', eyeShape: 'capsule', eyeHeight: 30 },
  monster: { name: 'Monster', shape: 'wide', color: '#4CAF50', eyeColor: '#111111', stageColor: '#0F1A0F', eyeShape: 'capsule', eyeHeight: 44 },
}

export function listAnimalStyles() {
  return Object.keys(ANIMAL_MASCOT_PRESETS)
}

export function createAnimalMascot(style = 'bear', overrides = {}) {
  const preset = ANIMAL_MASCOT_PRESETS[style] || ANIMAL_MASCOT_PRESETS.bear
  return createDefinition({ ...preset, ...overrides })
}
