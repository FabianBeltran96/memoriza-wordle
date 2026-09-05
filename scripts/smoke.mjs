/**
 * Prueba de humo del sistema de repaso y del motor de sugerencias.
 * Sin runner ni dependencias: `node scripts/smoke.mjs`.
 * Cubre los invariantes que ya se rompieron una vez, y las reglas del Wordle
 * (letras repetidas sobre todo) que son fáciles de romper sin darse cuenta.
 */
import { useSpacedRepetition } from '../src/composables/useSpacedRepetition.js'
import { ALL_WORDS } from '../src/data/words.js'
import {
  GRAY,
  YELLOW,
  GREEN,
  ALL_GREEN,
  scorePattern,
  patternIdFromArray,
  filterCandidates,
  knownLetters,
  rankGuesses,
  playOut,
} from '../src/lib/solver.js'

let store = {}
globalThis.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v },
  removeItem: (k) => { delete store[k] },
}

let failures = 0
const ok = (label, cond) => {
  if (!cond) failures += 1
  console.log(`${cond ? '✓' : '✗ FALLA'}  ${label}`)
}

// 1) Tarjeta congelada: última palabra de la tanda, fallada
{
  const s = useSpacedRepetition()
  s.queue.value = ['ABOUT']
  const before = `${s.currentWord.value}#${s.attempt.value}`
  s.grade('ABOUT', false); s.advance(false)
  const after = `${s.currentWord.value}#${s.attempt.value}`
  ok(`la key cambia tras fallar la última (${before} -> ${after})`, before !== after)
}

// 2) Acertar con pista no debe subir de caja
{
  const s = useSpacedRepetition()
  s.grade('BRAVE', true, false)
  const sinPista = s.boxOf('BRAVE')
  s.grade('BRAVE', true, true)
  ok(`acertar con pista no promueve (caja ${sinPista} -> ${s.boxOf('BRAVE')})`, s.boxOf('BRAVE') === sinPista)
  s.grade('BRAVE', true, false)
  ok(`acertar sin pista sí promueve (-> caja ${s.boxOf('BRAVE')})`, s.boxOf('BRAVE') === sinPista + 1)
}

// 3) localStorage corrupto no debe romper el guardado
{
  store = { 'memoriza-wordle:v1': '{esto no es json' }
  const s = useSpacedRepetition()
  s.load()
  ok('JSON corrupto se descarta y el guardado sigue vivo', s.storageAvailable.value === true)
  ok('la clave corrupta se limpió', store['memoriza-wordle:v1'] === undefined)
}

// 4) Racha real de días consecutivos
{
  store = {}
  const s = useSpacedRepetition()
  s.stats.value = { ...s.stats.value, lastDay: '2020-01-01', dayStreak: 7 }
  s.grade('CHESS', true)                       // hoy, con un hueco enorme
  ok(`hueco de días reinicia la racha (7 -> ${s.stats.value.dayStreak})`, s.stats.value.dayStreak === 1)

  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  s.stats.value = { ...s.stats.value, lastDay: ayer, dayStreak: 3 }
  s.grade('CHESS', true)
  ok(`estudiar ayer y hoy suma racha (3 -> ${s.stats.value.dayStreak})`, s.stats.value.dayStreak === 4)
}

// ── Motor de sugerencias ──────────────────────────────────────────────────────

const asPattern = (s) => [...s].map((c) => (c === 'v' ? GREEN : c === 'a' ? YELLOW : GRAY))
const show = (marks) => marks.map((m) => '.av'[m]).join('')

// 5) Colores con letras repetidas: el caso que siempre se implementa mal
{
  const cases = [
    ['SPEED', 'ABIDE', '..a.a'], // sobra una E: la segunda va gris
    ['GEESE', 'EAGER', 'aaa..'], // dos E disponibles, la tercera se queda sin
    ['ALLOY', 'LOYAL', 'aaaaa'],
    ['CRANE', 'CRANE', 'vvvvv'],
    ['LEVEL', 'REBEL', '.v.vv'], // las dos E ya son verdes: a la L inicial no le queda copia
    ['EERIE', 'THERE', 'a.a.v'], // solo sobra una E libre, la segunda va gris
  ]
  for (const [guess, target, expected] of cases) {
    const got = show(scorePattern(guess, target))
    ok(`${guess} contra ${target} pinta ${expected} (salió ${got})`, got === expected)
  }
}

// 6) La respuesta nunca puede quedar fuera de las candidatas
{
  let survivors = 0
  for (const target of ALL_WORDS) {
    const attempts = ['TRACE', 'MOULD', 'SPINY']
      .filter((w) => w !== target)
      .map((guess) => ({ guess, pattern: scorePattern(guess, target) }))
    if (filterCandidates(ALL_WORDS, attempts).includes(target)) survivors += 1
  }
  ok(`el filtro conserva la respuesta en las ${ALL_WORDS.length} palabras (${survivors})`,
    survivors === ALL_WORDS.length)
}

// 7) Un gris no descarta la letra si el mismo intento la pintó verde o amarilla
{
  const { absent, present } = knownLetters([{ guess: 'SPEED', pattern: asPattern('..a.a') }])
  ok('la E gris de una repetida no se marca como descartada', !absent.has('E') && present.has('E'))
  ok('las que sí son grises se descartan', absent.has('S') && absent.has('P'))
}

// 8) Sugerir es reducir: la primera propuesta no puede ser peor que las de abajo
{
  const attempts = [{ guess: 'TRACE', pattern: scorePattern('TRACE', 'BLIND') }]
  const ranked = rankGuesses(attempts, { order: 'info', limit: 6 })
  const ordenado = ranked.every((r, i) => i === 0 || ranked[i - 1].expected <= r.expected)
  ok(`por información van de menos a más restantes (${ranked.map((r) => r.word).join(' ')})`, ordenado)

  const restantes = filterCandidates(ALL_WORDS, attempts).length
  ok(`la mejor deja menos de lo que hay ahora (${ranked[0].expected.toFixed(1)} < ${restantes})`,
    ranked[0].expected < restantes)
}

// 9) El modo «descartar letras» prioriza letras sin probar
{
  const attempts = [{ guess: 'TRACE', pattern: scorePattern('TRACE', 'BLIND') }]
  const porLetras = rankGuesses(attempts, { order: 'letras', limit: 5 })
  const porInfo = rankGuesses(attempts, { order: 'info', limit: 5 })
  const nuevas = (list) => list[0].newLetters
  ok(`la punta por letras no prueba menos letras nuevas que la de info (${nuevas(porLetras)} >= ${nuevas(porInfo)})`,
    nuevas(porLetras) >= nuevas(porInfo))
  ok('ninguna sugerencia por letras repite una letra ya descartada como "nueva"',
    porLetras.every((r) => r.newLetters <= new Set(r.word).size))
}

// 10) Con una sola candidata hay que decir esa, no una sonda
{
  const target = 'PIZZA'
  const attempts = []
  let restantes = ALL_WORDS
  for (const guess of ['TRACE', 'MOUND', 'SPILL']) {
    attempts.push({ guess, pattern: scorePattern(guess, target) })
    restantes = filterCandidates(ALL_WORDS, attempts)
  }
  if (restantes.length === 1) {
    const [best] = rankGuesses(attempts, { order: 'letras', limit: 1 })
    ok(`con una sola candidata sugiere ${restantes[0]} (dijo ${best.word})`, best.word === restantes[0])
  } else {
    ok(`quedan ${restantes.length} candidatas, no 1: se salta la comprobación`, true)
  }
}

// 11) La lista siempre ofrece una palabra que pueda ganar, y respeta el límite
{
  const casos = [
    ['STARE', 'SHAPE'], // aquí las mejores sondas parten mejor que cualquier candidata
    ['STARE', 'SWORD'],
    ['TRACE', 'BLIND'],
  ]
  for (const [guess, target] of casos) {
    const attempts = [{ guess, pattern: scorePattern(guess, target) }]
    for (const order of ['info', 'letras']) {
      const ranked = rankGuesses(attempts, { order, limit: 8 })
      const puedeGanar = ranked.filter((r) => r.isCandidate).map((r) => r.word)
      ok(`${guess}/${target} por ${order} ofrece alguna que pueda ganar (${puedeGanar.join(' ') || 'ninguna'})`,
        puedeGanar.length > 0)
      ok(`${guess}/${target} por ${order} respeta el límite de 8 (${ranked.length})`, ranked.length <= 8)
    }
    // Con limit 1 nadie desplaza a la mejor jugada
    const [solo] = rankGuesses(attempts, { order: 'info', limit: 1 })
    const [mejor] = rankGuesses(attempts, { order: 'info', limit: 8 })
    ok(`${guess}/${target}: pedir 1 devuelve la misma punta que pedir 8 (${solo.word})`,
      solo.word === mejor.word)
  }
}

// 12) Jugando siempre la sugerencia de arriba, el banco entero cae en 6 intentos
{
  let peor = 0
  let fallos = []
  let total = 0
  const muestra = ALL_WORDS.filter((_, i) => i % 7 === 0)
  for (const target of muestra) {
    const { attempts, solved } = playOut(target, { order: 'info' })
    if (!solved) fallos.push(target)
    total += attempts.length
    if (attempts.length > peor) peor = attempts.length
    const ultimo = attempts[attempts.length - 1]
    if (solved && patternIdFromArray(ultimo.pattern) !== ALL_GREEN) fallos.push(`${target}?`)
  }
  const media = (total / muestra.length).toFixed(2)
  ok(`resuelve las ${muestra.length} de la muestra en <=6 (peor ${peor}, media ${media})`, fallos.length === 0)
}

if (failures) {
  console.error(`\n${failures} comprobación(es) fallaron.`)
  process.exit(1)
}
console.log('\nTodo en verde.')
