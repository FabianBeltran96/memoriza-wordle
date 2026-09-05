/**
 * Motor de sugerencias estilo Wordle.
 *
 * Tres piezas independientes:
 *  1. `patternIdOf` colorea un intento contra una palabra objetivo.
 *  2. `filterCandidates` deja solo las palabras compatibles con todos los intentos.
 *  3. `rankGuesses` ordena qué conviene jugar ahora.
 *
 * Sin dependencias de Vue a propósito: lo usa el componente y también
 * `scripts/smoke.mjs` desde Node.
 */
import { ALL_WORDS } from '../data/words.js'

export const GRAY = 0
export const YELLOW = 1
export const GREEN = 2

export const WORD_LENGTH = 5
export const MAX_ATTEMPTS = 6
export const PATTERN_COUNT = 243 // 3^5
export const ALL_GREEN = PATTERN_COUNT - 1

const CODE_A = 65
const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(CODE_A + i))

/** Buffer reutilizado por `patternIdOf`: JS es monohilo, nadie lo pisa a medias. */
const remaining = new Int8Array(26)

/**
 * Devuelve el patrón de colores de `guess` contra `target`, codificado en base 3
 * (posición 0 es el dígito más significativo). Un entero en vez de un array
 * porque `rankGuesses` lo usa como índice de bucket millones de veces.
 *
 * Maneja repetidas como el Wordle real: primero se reparten los verdes y solo
 * las copias sobrantes del objetivo pueden pintar amarillos.
 */
export function patternIdOf(guess, target) {
  remaining.fill(0)
  let greens = 0

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess.charCodeAt(i) === target.charCodeAt(i)) greens |= 1 << i
    else remaining[target.charCodeAt(i) - CODE_A] += 1
  }

  let id = 0
  for (let i = 0; i < WORD_LENGTH; i++) {
    let mark = GRAY
    if (greens & (1 << i)) {
      mark = GREEN
    } else {
      const letter = guess.charCodeAt(i) - CODE_A
      if (remaining[letter] > 0) {
        mark = YELLOW
        remaining[letter] -= 1
      }
    }
    id = id * 3 + mark
  }
  return id
}

/** Patrón como array de 5 marcas, para pintar la cuadrícula. */
export function patternToArray(id) {
  const marks = new Array(WORD_LENGTH)
  for (let i = WORD_LENGTH - 1; i >= 0; i--) {
    marks[i] = id % 3
    id = Math.floor(id / 3)
  }
  return marks
}

export function patternIdFromArray(marks) {
  let id = 0
  for (let i = 0; i < WORD_LENGTH; i++) id = id * 3 + (marks[i] ?? GRAY)
  return id
}

/** Colores de `guess` contra `target`, como array. Azúcar sobre `patternIdOf`. */
export const scorePattern = (guess, target) => patternToArray(patternIdOf(guess, target))

/**
 * Palabras del banco que siguen siendo posibles.
 *
 * La regla es una sola: si la palabra fuera la respuesta, cada intento tendría
 * que haber salido exactamente con los colores que salió. Eso cubre verdes,
 * amarillos, grises y el caso feo de las letras repetidas sin reglas aparte.
 */
export function filterCandidates(words, attempts) {
  if (!attempts.length) return [...words]
  const checks = attempts.map((a) => ({ guess: a.guess, id: patternIdFromArray(a.pattern) }))
  return words.filter((word) => checks.every((c) => patternIdOf(c.guess, word) === c.id))
}

/**
 * Qué se sabe ya de cada letra: presente, descartada o sin probar.
 *
 * Un gris no descarta la letra si el mismo intento la pintó verde o amarilla en
 * otra posición: ahí el gris significa «no hay más copias», no «no está». Por
 * eso se recogen primero todas las presentes y solo después se marcan ausencias.
 */
export function knownLetters(attempts) {
  const present = new Set()
  const placed = new Set()
  const grayed = new Set()

  for (const { guess, pattern } of attempts) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guess[i]
      if (pattern[i] === GREEN) {
        present.add(letter)
        placed.add(letter)
      } else if (pattern[i] === YELLOW) {
        present.add(letter)
      } else {
        grayed.add(letter)
      }
    }
  }

  const absent = new Set([...grayed].filter((letter) => !present.has(letter)))
  const unknown = new Set(ALPHABET.filter((l) => !present.has(l) && !absent.has(l)))
  return { present, placed, absent, unknown }
}

/** Fracción de candidatas que contiene cada letra. Base del puntaje de descarte. */
function letterCoverage(candidates) {
  const hits = new Map()
  for (const word of candidates) {
    for (const letter of new Set(word)) hits.set(letter, (hits.get(letter) ?? 0) + 1)
  }
  const coverage = new Map()
  for (const [letter, count] of hits) coverage.set(letter, count / candidates.length)
  return coverage
}

/**
 * Evalúa jugar `guess` contra el conjunto de candidatas.
 *
 * `expected` es cuántas palabras quedarían en promedio: se agrupan las
 * candidatas por el color que devolverían y cada grupo pesa según su
 * probabilidad de ocurrir (Σ nᵢ²/N). Menos es mejor.
 */
function evaluate(guess, candidates, buckets, coverage, unknown, candidateSet) {
  buckets.fill(0)
  for (const word of candidates) buckets[patternIdOf(guess, word)] += 1

  const total = candidates.length
  let expected = 0
  let worst = 0
  let bits = 0
  for (let id = 0; id < PATTERN_COUNT; id++) {
    const n = buckets[id]
    if (!n) continue
    expected += (n * n) / total
    if (n > worst) worst = n
    const p = n / total
    bits -= p * Math.log2(p)
  }

  // Puntaje de descarte: letras aún sin probar que este intento pondría a
  // prueba, cada una pesada por qué tan probable es que aparezca. Responde a
  // «cuántas letras me quita de encima», que no siempre coincide con la
  // partición más fina.
  let letterScore = 0
  let newLetters = 0
  for (const letter of new Set(guess)) {
    if (!unknown.has(letter)) continue
    newLetters += 1
    letterScore += coverage.get(letter) ?? 0
  }

  return {
    word: guess,
    expected,
    worst,
    bits,
    newLetters,
    letterScore,
    isCandidate: candidateSet.has(guess),
  }
}

const rankCache = new Map()
const RANK_CACHE_LIMIT = 40

/**
 * Ordena las mejores jugadas.
 *
 * - `order: 'info'` minimiza las palabras que quedarían en promedio.
 * - `order: 'letras'` maximiza las letras nuevas que se ponen a prueba, que es
 *   lo que uno quiere cuando todavía va a ciegas.
 *
 * `onlyCandidates` restringe el pool a palabras que aún podrían ser la
 * respuesta (modo difícil); con `false` también propone «sondas»: palabras que
 * no pueden ganar pero parten mejor el conjunto.
 *
 * Nunca recibe la palabra del día: las sugerencias salen solo de los intentos,
 * igual que jugando de verdad.
 */
export function rankGuesses(attempts, options = {}) {
  const { order = 'info', onlyCandidates = false, limit = 10, words = ALL_WORDS } = options

  const key = `${order}|${onlyCandidates}|${limit}|${words.length}|${attempts
    .map((a) => `${a.guess}:${patternIdFromArray(a.pattern)}`)
    .join(',')}`
  const cached = rankCache.get(key)
  if (cached) return cached

  const candidates = filterCandidates(words, attempts)
  let result = []

  if (candidates.length) {
    const candidateSet = new Set(candidates)
    const coverage = letterCoverage(candidates)
    const { unknown } = knownLetters(attempts)
    const buckets = new Int32Array(PATTERN_COUNT)
    const pool = onlyCandidates ? candidates : words

    const scored = pool.map((guess) =>
      evaluate(guess, candidates, buckets, coverage, unknown, candidateSet),
    )

    // Con dos o menos candidatas ya no hay nada que descartar: se adivina. Ahí
    // ordenar por letras nuevas propondría una sonda que no puede ganar.
    const byInfo = order === 'info' || candidates.length <= 2

    scored.sort((a, b) => {
      if (byInfo) {
        if (a.expected !== b.expected) return a.expected - b.expected
      } else {
        if (a.letterScore !== b.letterScore) return b.letterScore - a.letterScore
        if (a.expected !== b.expected) return a.expected - b.expected
      }
      if (a.isCandidate !== b.isCandidate) return a.isCandidate ? -1 : 1
      return a.word < b.word ? -1 : 1
    })

    // Una sonda solo se gana su lugar si parte el conjunto MEJOR que cualquier
    // palabra que además podría ganar de una. Empatar no basta: con dos
    // candidatas, media docena de sondas parten igual de bien y la lista se
    // llenaba de palabras que no pueden terminar la partida.
    const bestCandidate = scored.reduce(
      (best, r) => (r.isCandidate && r.expected < best ? r.expected : best),
      Infinity,
    )

    const shortlist = scored.filter((r) => (r.isCandidate ? true : r.expected < bestCandidate))
    result = shortlist.slice(0, limit)

    // ...pero la lista nunca puede quedarse sin una palabra que pueda ganar.
    // A veces media docena de sondas parten mejor que cualquier candidata y
    // llenaban los ocho puestos: útil para descartar, inútil para terminar.
    // Se reservan los últimos dos para las mejores que sí pueden ser la
    // respuesta, y quedan abajo porque efectivamente descartan menos.
    // Reservar nunca puede desplazar a la mejor jugada: con `limit` corto se
    // reserva menos, y con `limit` de 1 no se reserva nada.
    const room = Math.min(2, Math.max(0, limit - 1))
    const winners = shortlist.filter((r) => r.isCandidate).slice(0, room)
    if (winners.length && !result.some((r) => r.isCandidate)) {
      result = [...result.slice(0, limit - winners.length), ...winners]
    }
  }

  if (rankCache.size >= RANK_CACHE_LIMIT) rankCache.delete(rankCache.keys().next().value)
  rankCache.set(key, result)
  return result
}

/**
 * Juega una partida completa contra `target` eligiendo siempre la sugerencia
 * de arriba. Sirve para medir el motor, y para el botón «resolver sola».
 */
export function playOut(target, options = {}) {
  const { maxAttempts = MAX_ATTEMPTS, ...rankOptions } = options
  const attempts = []
  for (let i = 0; i < maxAttempts; i++) {
    const [best] = rankGuesses(attempts, { ...rankOptions, limit: 1 })
    if (!best) break
    const pattern = scorePattern(best.word, target)
    attempts.push({ guess: best.word, pattern })
    if (patternIdFromArray(pattern) === ALL_GREEN) return { attempts, solved: true }
  }
  return { attempts, solved: false }
}
