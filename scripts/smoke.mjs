/**
 * Prueba de humo del sistema de repaso. Sin runner ni dependencias: `node scripts/smoke.mjs`.
 * Cubre los invariantes que ya se rompieron una vez.
 */
import { useSpacedRepetition } from '../src/composables/useSpacedRepetition.js'

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

if (failures) {
  console.error(`\n${failures} comprobación(es) fallaron.`)
  process.exit(1)
}
console.log('\nTodo en verde.')
