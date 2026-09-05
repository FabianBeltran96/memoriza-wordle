<script setup>
import { ref, computed, nextTick } from 'vue'
import { ALL_WORDS, MEANINGS } from '../data/words.js'
import {
  GRAY,
  GREEN,
  ALL_GREEN,
  MAX_ATTEMPTS,
  WORD_LENGTH,
  scorePattern,
  patternIdFromArray,
  filterCandidates,
  knownLetters,
  rankGuesses,
} from '../lib/solver.js'

const ORDERS = [
  { id: 'letras', label: 'Descartar letras' },
  { id: 'info', label: 'Descartar palabras' },
]

const KEYBOARD = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

const attempts = ref([])
const draft = ref('')
const draftMarks = ref([GRAY, GRAY, GRAY, GRAY, GRAY])
const target = ref('')
const revealTarget = ref(false)
const order = ref('letras')
const onlyCandidates = ref(false)
const draftInput = ref(null)

const onlyLetters = (value) => value.replace(/[^a-zA-Z]/g, '').toUpperCase()

/**
 * Limpia el texto y lo devuelve al input. Sin ese eco, un carácter descartado
 * deja `value` igual, Vue no re-renderiza y el DOM sigue mostrando lo inválido.
 */
function sanitize(event, limit = WORD_LENGTH) {
  const clean = onlyLetters(event.target.value).slice(0, limit)
  if (event.target.value !== clean) event.target.value = clean
  return clean
}

/** Con palabra del día puesta, la app pinta sola cada intento. */
const autoColor = computed(() => target.value.length === WORD_LENGTH)

function onDraftInput(event) {
  draft.value = sanitize(event)
  if (!autoColor.value) draftMarks.value = [GRAY, GRAY, GRAY, GRAY, GRAY]
}

/** Colores del intento en curso: calculados si hay palabra del día, si no a mano. */
const draftPattern = computed(() => {
  if (autoColor.value && draft.value.length === WORD_LENGTH) {
    return scorePattern(draft.value, target.value)
  }
  return draftMarks.value
})

function cycleMark(index) {
  if (autoColor.value || !draft.value[index]) return
  const next = [...draftMarks.value]
  next[index] = (next[index] + 1) % 3
  draftMarks.value = next
}

const solved = computed(() =>
  attempts.value.some((a) => patternIdFromArray(a.pattern) === ALL_GREEN),
)

const canSubmit = computed(
  () => draft.value.length === WORD_LENGTH && !solved.value && attempts.value.length < MAX_ATTEMPTS,
)

function submit() {
  if (!canSubmit.value) return
  attempts.value = [...attempts.value, { guess: draft.value, pattern: [...draftPattern.value] }]
  draft.value = ''
  draftMarks.value = [GRAY, GRAY, GRAY, GRAY, GRAY]
  nextTick(() => draftInput.value?.focus())
}

function undo() {
  attempts.value = attempts.value.slice(0, -1)
}

function clearAll() {
  attempts.value = []
  draft.value = ''
  draftMarks.value = [GRAY, GRAY, GRAY, GRAY, GRAY]
}

function useWord(word) {
  draft.value = word
  if (!autoColor.value) draftMarks.value = [GRAY, GRAY, GRAY, GRAY, GRAY]
  nextTick(() => draftInput.value?.focus())
}

/**
 * Las candidatas y las sugerencias salen SOLO de los intentos, nunca de
 * `target`. La palabra del día es un corrector de colores, no un soplón.
 */
const candidates = computed(() => filterCandidates(ALL_WORDS, attempts.value))

const suggestions = computed(() => {
  if (solved.value) return []
  return rankGuesses(attempts.value, {
    order: order.value,
    onlyCandidates: onlyCandidates.value,
    limit: 8,
  })
})

const known = computed(() => knownLetters(attempts.value))

function keyState(letter) {
  const { placed, present, absent } = known.value
  if (placed.has(letter)) return 'green'
  if (present.has(letter)) return 'yellow'
  if (absent.has(letter)) return 'gray'
  return ''
}

const discardedCount = computed(() => known.value.absent.size)

/** La palabra del día tiene que estar en el banco o el filtro se queda en cero. */
const targetOutsideBank = computed(
  () => autoColor.value && !ALL_WORDS.includes(target.value),
)

const contradiction = computed(
  () => attempts.value.length > 0 && candidates.value.length === 0 && !targetOutsideBank.value,
)

const RESULT_LIMIT = 60
const visibleCandidates = computed(() => candidates.value.slice(0, RESULT_LIMIT))

const markClass = (mark) => (mark === GREEN ? 'tile--green' : mark === GRAY ? 'tile--gray' : 'tile--yellow')

const fmt = (n) => (n >= 10 ? Math.round(n) : n.toFixed(1))
</script>

<template>
  <section>
    <p class="intro">
      Escribe tus intentos con los colores que te dio el Wordle y te digo qué jugar ahora para
      quitarte de encima la mayor cantidad de letras.
    </p>

    <details class="target">
      <summary>Palabra del día (opcional)</summary>
      <p class="target__note">
        Si la pones, la app pinta sola los colores de cada intento. Las sugerencias se siguen
        calculando solo con lo que ya jugaste, así que puedes practicar sin hacer trampa.
      </p>
      <div class="target__row">
        <input
          class="text-input"
          :type="revealTarget ? 'text' : 'password'"
          :value="target"
          placeholder="ej. CRANE"
          maxlength="5"
          inputmode="latin"
          autocapitalize="characters"
          autocorrect="off"
          spellcheck="false"
          aria-label="Palabra del día"
          @input="target = sanitize($event)"
        />
        <button class="btn btn--ghost" @click="revealTarget = !revealTarget">
          {{ revealTarget ? 'ocultar' : 'ver' }}
        </button>
      </div>
      <p v-if="targetOutsideBank" class="warning">
        «{{ target }}» no está en el banco de {{ ALL_WORDS.length }} palabras: los colores salen
        bien, pero ninguna candidata va a encajar.
      </p>
    </details>

    <div class="board">
      <div v-for="(row, r) in attempts" :key="r" class="row">
        <div v-for="(mark, i) in row.pattern" :key="i" class="tile" :class="markClass(mark)">
          {{ row.guess[i] }}
        </div>
      </div>

      <div v-if="!solved && attempts.length < MAX_ATTEMPTS" class="row">
        <button
          v-for="i in WORD_LENGTH"
          :key="i"
          class="tile tile--draft"
          :class="draft[i - 1] ? markClass(draftPattern[i - 1]) : 'tile--empty'"
          :disabled="autoColor || !draft[i - 1]"
          :aria-label="`Cambiar el color de la letra ${i}`"
          @click="cycleMark(i - 1)"
        >
          {{ draft[i - 1] || '' }}
        </button>
      </div>
    </div>

    <p v-if="!solved && attempts.length < MAX_ATTEMPTS && !autoColor" class="hint">
      Toca cada casilla para cambiar su color: gris → amarillo → verde.
    </p>

    <div v-if="!solved && attempts.length < MAX_ATTEMPTS" class="entry">
      <input
        ref="draftInput"
        class="text-input text-input--guess"
        type="text"
        :value="draft"
        placeholder="Tu intento"
        maxlength="5"
        inputmode="latin"
        autocapitalize="characters"
        autocorrect="off"
        spellcheck="false"
        aria-label="Palabra que jugaste"
        @input="onDraftInput"
        @keyup.enter="submit"
      />
      <button class="btn btn--go" :disabled="!canSubmit" @click="submit">Agregar</button>
    </div>

    <div class="board-actions">
      <span class="counter">
        Intento {{ Math.min(attempts.length + 1, MAX_ATTEMPTS) }} de {{ MAX_ATTEMPTS }} ·
        {{ discardedCount }} letras descartadas
      </span>
      <span>
        <button v-if="attempts.length" class="link" @click="undo">deshacer</button>
        <button v-if="attempts.length" class="link" @click="clearAll">empezar de nuevo</button>
      </span>
    </div>

    <div class="keyboard">
      <div v-for="row in KEYBOARD" :key="row" class="keyboard__row">
        <span v-for="letter in row" :key="letter" class="key" :class="`key--${keyState(letter)}`">
          {{ letter }}
        </span>
      </div>
    </div>

    <p v-if="solved" class="banner banner--good">
      Resuelta en {{ attempts.length }} {{ attempts.length === 1 ? 'intento' : 'intentos' }}.
    </p>
    <p v-else-if="contradiction" class="banner banner--bad">
      Ninguna palabra del banco cumple esos colores. Revisa los grises: si una letra sale repetida,
      la copia sobrante va gris aunque la letra sí esté.
    </p>
    <p v-else-if="attempts.length >= MAX_ATTEMPTS" class="banner banner--bad">
      Se acabaron los {{ MAX_ATTEMPTS }} intentos.
    </p>

    <template v-if="suggestions.length">
      <div class="section-head">
        <h2 class="heading">Qué jugar ahora</h2>
        <span class="counter">{{ candidates.length }} posibles</span>
      </div>

      <div class="controls">
        <button
          v-for="item in ORDERS"
          :key="item.id"
          class="chip"
          :class="{ 'chip--active': order === item.id }"
          @click="order = item.id"
        >
          {{ item.label }}
        </button>
        <button
          class="chip"
          :class="{ 'chip--active': onlyCandidates }"
          @click="onlyCandidates = !onlyCandidates"
        >
          Solo posibles
        </button>
      </div>

      <p class="explain">
        <template v-if="order === 'letras'">
          Ordenado por letras nuevas que pone a prueba, pesando cuánto aparece cada una entre las
          candidatas.
        </template>
        <template v-else>
          Ordenado por cuántas palabras quedarían en promedio después de jugarla.
        </template>
      </p>

      <ol class="suggestions">
        <li v-for="(item, i) in suggestions" :key="item.word" class="suggestion">
          <button class="suggestion__main" @click="useWord(item.word)">
            <span class="suggestion__rank">{{ i + 1 }}</span>
            <span class="suggestion__word" lang="en">{{ item.word }}</span>
            <span class="suggestion__meaning">{{ MEANINGS[item.word] }}</span>
          </button>
          <div class="suggestion__stats">
            <span class="tag" :class="item.isCandidate ? 'tag--can-win' : 'tag--probe'">
              {{ item.isCandidate ? 'puede ganar' : 'sonda' }}
            </span>
            <span>{{ item.newLetters }} letras nuevas</span>
            <span>deja ~{{ fmt(item.expected) }}</span>
          </div>
        </li>
      </ol>
    </template>

    <template v-if="attempts.length && candidates.length">
      <h2 class="heading">Palabras que aún encajan</h2>
      <div class="results scrollable">
        <div v-for="word in visibleCandidates" :key="word" class="result">
          <span class="result__word" lang="en">{{ word }}</span>
          <span class="result__meaning">{{ MEANINGS[word] }}</span>
        </div>
        <p v-if="candidates.length > RESULT_LIMIT" class="empty">
          Mostrando las primeras {{ RESULT_LIMIT }} de {{ candidates.length }}.
        </p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.intro {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.55;
  margin: 0 0 14px;
}

.target {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 9px 11px;
  margin-bottom: 16px;
  background: var(--card);
}

.target summary {
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--muted);
}

.target__note {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
  margin: 9px 0;
}

.target__row {
  display: flex;
  gap: 7px;
  align-items: stretch;
}

.text-input {
  width: 100%;
  padding: 9px 10px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 15px;
  letter-spacing: 0.15em;
}

.text-input:focus {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 9px;
}

.row {
  display: flex;
  gap: 5px;
}

.tile {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 2px solid transparent;
  font-family: var(--mono);
  font-size: 19px;
  font-weight: 700;
  color: #fff;
  padding: 0;
}

.tile--draft {
  cursor: pointer;
  font-family: var(--mono);
}

.tile--draft:disabled {
  cursor: default;
}

.tile--empty {
  background: #fff;
  border-color: var(--line);
  color: var(--ink);
}

.tile--gray {
  background: var(--muted);
}

.tile--yellow {
  background: var(--amber);
}

.tile--green {
  background: var(--moss);
}

.hint {
  font-size: 11px;
  color: var(--muted);
  margin: 0 0 10px;
}

.entry {
  display: flex;
  gap: 7px;
  margin-bottom: 10px;
}

.text-input--guess {
  flex: 1;
}

.board-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 14px;
}

.counter {
  font-size: 11px;
  color: var(--muted);
}

.link {
  border: none;
  background: none;
  color: var(--blue);
  font-family: inherit;
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0 0 0 10px;
}

.keyboard {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  margin-bottom: 16px;
}

.keyboard__row {
  display: flex;
  gap: 3px;
}

.key {
  width: 25px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  background: var(--track);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
}

.key--green {
  background: var(--moss);
  color: #fff;
}

.key--yellow {
  background: var(--amber);
  color: #fff;
}

.key--gray {
  background: var(--line);
  color: var(--muted);
  opacity: 0.55;
}

.banner {
  font-size: 13px;
  line-height: 1.5;
  border-radius: 5px;
  padding: 9px 11px;
  margin: 0 0 16px;
}

.banner--good {
  background: rgba(64, 115, 75, 0.12);
  color: var(--moss);
}

.banner--bad {
  background: rgba(122, 64, 100, 0.1);
  color: var(--plum);
}

.warning {
  font-size: 11px;
  color: var(--amber);
  margin: 9px 0 0;
  line-height: 1.5;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}

.heading {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 9px;
}

.controls {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 9px;
}

.chip {
  padding: 5px 11px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.chip--active {
  border-color: var(--blue);
  background: var(--blue);
  color: #fff;
}

.explain {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
  margin: 0 0 10px;
}

.suggestions {
  list-style: none;
  margin: 0 0 22px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.suggestion {
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--card);
  padding: 7px 9px;
}

.suggestion__main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  border: none;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0;
  color: var(--ink);
}

.suggestion__rank {
  font-size: 11px;
  color: var(--muted);
  width: 12px;
  flex: none;
}

.suggestion__word {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.08em;
}

.suggestion__meaning {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion__stats {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 11px;
  color: var(--muted);
  padding-left: 20px;
  margin-top: 3px;
}

.tag {
  border-radius: 9px;
  padding: 1px 7px;
  font-size: 10px;
  font-weight: 600;
}

.tag--can-win {
  background: rgba(64, 115, 75, 0.14);
  color: var(--moss);
}

.tag--probe {
  background: var(--track);
  color: var(--muted);
}

.results {
  max-height: 220px;
  margin-bottom: 8px;
}

.result {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.result__word {
  font-family: var(--mono);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.result__meaning {
  color: var(--muted);
  font-size: 12px;
}

.empty {
  font-size: 12px;
  color: var(--muted);
  margin: 10px 2px;
}
</style>
