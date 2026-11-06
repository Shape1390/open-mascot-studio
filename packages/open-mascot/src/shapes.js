// packages/open-mascot/src/shapes.js
// Blob proportions - 7 original + Robot / Cat / Ghost / Paper

export const BLOB_PRESETS = {
  round: { width: 200, height: 200 },
  soft: { width: 210, height: 200 },
  compact: { width: 190, height: 180 },
  wide: { width: 240, height: 180 },
  tall: { width: 180, height: 240 },
  large: { width: 260, height: 260 },
  drop: { width: 200, height: 230 },
  robot: { width: 210, height: 210 },
  cat: { width: 200, height: 215 },
  ghost: { width: 190, height: 235 },
  paper: { width: 200, height: 200 },
}

export function hasBlobShape(shape) {
  return shape in BLOB_PRESETS
}

export function getBlobPreset(shape) {
  return BLOB_PRESETS[shape] || BLOB_PRESETS.soft
}

export function listBlobShapes() {
  return Object.keys(BLOB_PRESETS)
}
