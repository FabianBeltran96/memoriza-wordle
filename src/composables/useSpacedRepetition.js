import { ref, computed, watch } from 'vue'
import { ALL_WORDS } from '../data/words.js'

/**
 * Sistema de cajas de Leitner.
 * El índice es la caja; el valor son los minutos hasta el siguiente repaso.
 */
export const BOX_INTERVALS = [0, 10, 60 * 24, 60 * 24 * 3, 60 * 24 * 7, 60 * 24 * 21]
export const MASTER_BOX = 5
export const BATCH_SIZE = 20

const STORAGE_KEY = 'memoriza-wordle:v1'

const emptyStats = () => ({ answered: 0, correct: 0, lastDay: null, dayStreak: 0 })

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Estado de estudio: progreso por palabra, estadísticas y la cola de la tanda actual.
 * Persiste en localStorage con un watch deep y debounce.
 */
export function useSpacedRepetition() {
  /** @type {import('vue').Ref<Record<string, {box:number,due:number,right:number,wrong:number}>>} */
  const progress = ref({})
  const stats = ref(emptyStats())
  const queue = ref([])
  const storageAvailable = ref(true)

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        progress.value = parsed.progress ?? {}
        stats.value = { ...emptyStats(), ...(parsed.stats ?? {}) }
      }
    } catch {
      storageAvailable.value = false
    }
  }

  let saveTimer = null
  watch(
    [progress, stats],
    () => {
      if (!storageAvailable.value) return
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ progress: progress.value, stats: stats.value }),
          )
        } catch {
          storageAvailable.value = false
        }
      }, 500)
    },
    { deep: true },
  )

  const boxOf = (word) => progress.value[word]?.box ?? 0

  /** Arma una tanda: primero lo vencido, luego palabras nuevas hasta completar. */
  function buildQueue() {
    const now = Date.now()
    const due = []
    const fresh = []

    for (const word of ALL_WORDS) {
      const entry = progress.value[word]
      if (!entry) fresh.push(word)
      else if (entry.box < MASTER_BOX && entry.due <= now) due.push(word)
    }

    due.sort((a, b) => progress.value[a].due - progress.value[b].due)

    const dueSlice = due.slice(0, BATCH_SIZE)
    const freshSlice = shuffle(fresh).slice(0, Math.max(0, BATCH_SIZE - dueSlice.length))
    const batch = shuffle([...dueSlice, ...freshSlice])

    // Si no hay nada vencido ni nuevo, repasa igual las que no estén dominadas.
    if (batch.length === 0) {
      const notMastered = ALL_WORDS.filter((w) => boxOf(w) < MASTER_BOX)
      queue.value = shuffle(notMastered).slice(0, BATCH_SIZE)
      return
    }

    queue.value = batch
  }

  const currentWord = computed(() => queue.value[0] ?? null)

  /** Registra el resultado y reprograma la palabra según su nueva caja. */
  function grade(word, wasRight) {
    const previous = progress.value[word] ?? { box: 0, right: 0, wrong: 0 }
    const nextBox = wasRight ? Math.min(MASTER_BOX, previous.box + 1) : 0

    progress.value = {
      ...progress.value,
      [word]: {
        box: nextBox,
        due: Date.now() + BOX_INTERVALS[nextBox] * 60_000,
        right: previous.right + (wasRight ? 1 : 0),
        wrong: previous.wrong + (wasRight ? 0 : 1),
      },
    }

    const day = todayKey()
    const isNewDay = stats.value.lastDay !== day
    stats.value = {
      answered: stats.value.answered + 1,
      correct: stats.value.correct + (wasRight ? 1 : 0),
      lastDay: day,
      dayStreak: isNewDay ? stats.value.dayStreak + 1 : Math.max(1, stats.value.dayStreak),
    }
  }

  /**
   * Saca la palabra actual de la cola.
   * Si se acertó y ya salió de la caja 0, no vuelve hoy; si no, reaparece pronto.
   */
  function advance(wasRight) {
    const [head, ...rest] = queue.value
    if (!head) return

    if (wasRight && boxOf(head) >= 1) {
      if (rest.length) queue.value = rest
      else buildQueue()
      return
    }

    const reinserted = [...rest]
    reinserted.splice(Math.min(rest.length, 3), 0, head)
    queue.value = reinserted
  }

  function reset() {
    progress.value = {}
    stats.value = emptyStats()
    buildQueue()
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* no pasa nada */
    }
  }

  const masteredCount = computed(() => ALL_WORDS.filter((w) => boxOf(w) >= MASTER_BOX).length)
  const startedCount = computed(() => Object.keys(progress.value).length)
  const accuracy = computed(() =>
    stats.value.answered ? Math.round((stats.value.correct / stats.value.answered) * 100) : 0,
  )

  const boxCounts = computed(() => {
    const counts = Array(BOX_INTERVALS.length).fill(0)
    for (const word of ALL_WORDS) counts[boxOf(word)] += 1
    return counts
  })

  /** Las que más veces has fallado respecto a acertado. */
  const hardestWords = computed(() =>
    ALL_WORDS.filter((w) => (progress.value[w]?.wrong ?? 0) > 0)
      .sort((a, b) => {
        const scoreOf = (w) => progress.value[w].wrong - progress.value[w].right
        return scoreOf(b) - scoreOf(a)
      })
      .slice(0, 20)
      .map((word) => ({ word, ...progress.value[word] })),
  )

  return {
    progress,
    stats,
    queue,
    currentWord,
    storageAvailable,
    boxOf,
    load,
    buildQueue,
    grade,
    advance,
    reset,
    masteredCount,
    startedCount,
    accuracy,
    boxCounts,
    hardestWords,
  }
}
