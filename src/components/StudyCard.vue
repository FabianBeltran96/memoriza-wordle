<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { MEANINGS } from '../data/words.js'

const props = defineProps({
  word: { type: String, required: true },
  mode: { type: String, default: 'mixto' }, // mixto | traduccion | anagrama | patron
})

const emit = defineEmits(['graded', 'next'])

/** Orden en que las pistas van descubriendo casillas: primera, última, centro. */
const HINT_ORDER = [0, 4, 2]
const MAX_HINTS = 2

const answer = ref('')
const verdict = ref(null) // null | 'correcto' | 'incorrecto' | 'rendido'
const hinted = ref([]) // posiciones descubiertas con el botón "Pista"
const cardMode = ref('traduccion')
const scrambled = ref('')
const revealedPositions = ref([]) // posiciones que el modo "patron" regala de entrada
const inputEl = ref(null)

const meaning = computed(() => MEANINGS[props.word])

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function scramble(word) {
  let out = word
  let guard = 0
  while (out === word && guard++ < 20) out = shuffle([...word]).join('')
  return out
}

/** Reinicia la tarjeta y elige el modo de esta ronda. */
function setupCard() {
  cardMode.value =
    props.mode === 'mixto'
      ? ['traduccion', 'anagrama', 'patron'][Math.floor(Math.random() * 3)]
      : props.mode

  scrambled.value = cardMode.value === 'anagrama' ? scramble(props.word) : ''
  revealedPositions.value = cardMode.value === 'patron' ? shuffle([0, 1, 2, 3, 4]).slice(0, 2) : []

  answer.value = ''
  verdict.value = null
  hinted.value = []

  nextTick(() => inputEl.value?.focus())
}

watch(() => [props.word, props.mode], setupCard, { immediate: true })

const prompt = computed(() => {
  if (cardMode.value === 'traduccion') return `Escribe en inglés: “${meaning.value}”`
  if (cardMode.value === 'anagrama') return 'Ordena estas letras'
  return `Completa la palabra: “${meaning.value}”`
})

/** Siguiente casilla que descubriría una pista, o null si ya no quedan. */
const nextHint = computed(() => {
  if (hinted.value.length >= MAX_HINTS) return null
  const taken = [...revealedPositions.value, ...hinted.value]
  return HINT_ORDER.find((i) => !taken.includes(i)) ?? null
})

const canHint = computed(() => nextHint.value !== null && !verdict.value)

/** Acertar con pista no cuenta como dominio: la respuesta salió de la muleta. */
const usedHint = computed(() => hinted.value.length > 0)

/** Estado visual de cada casilla, en orden. */
const tiles = computed(() =>
  [0, 1, 2, 3, 4].map((i) => {
    if (verdict.value) {
      return { letter: props.word[i], state: verdict.value === 'correcto' ? 'correcto' : 'malo' }
    }
    if (revealedPositions.value.includes(i) || hinted.value.includes(i)) {
      return { letter: props.word[i], state: 'pista' }
    }
    const typed = answer.value[i]
    return { letter: typed ?? '', state: typed ? 'escrita' : 'vacia' }
  }),
)

const canSubmit = computed(() => answer.value.length === 5 && !verdict.value)

/**
 * Normaliza a mayúsculas sin símbolos. Escribe el valor limpio de vuelta en el
 * input: si el carácter tecleado se descarta, `answer` no cambia, Vue no
 * re-renderiza y el DOM se quedaría mostrando la basura que el modelo ya rechazó.
 */
function onInput(event) {
  const clean = event.target.value
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 5)
  answer.value = clean
  if (event.target.value !== clean) event.target.value = clean
}

function takeHint() {
  if (!canHint.value) return
  hinted.value = [...hinted.value, nextHint.value]
}

function submit() {
  if (!canSubmit.value) return
  const wasRight = answer.value === props.word
  verdict.value = wasRight ? 'correcto' : 'incorrecto'
  emit('graded', wasRight, usedHint.value)
}

function giveUp() {
  if (verdict.value) return
  verdict.value = 'rendido'
  emit('graded', false, usedHint.value)
}

function goNext() {
  emit('next', verdict.value === 'correcto')
}

function onKeydown(event) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  if (verdict.value) goNext()
  else submit()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="card">
    <p class="prompt">
      <template v-if="verdict === 'correcto'">Correcto</template>
      <template v-else-if="verdict">La palabra era</template>
      <template v-else>{{ prompt }}</template>
    </p>

    <p v-if="cardMode === 'anagrama' && !verdict" class="scrambled" lang="en">{{ scrambled }}</p>

    <div class="tiles">
      <div
        v-for="(tile, i) in tiles"
        :key="i"
        class="tile"
        :class="[`tile--${tile.state}`, { 'tile--flip': verdict }]"
        :style="verdict ? { animationDelay: `${i * 60}ms` } : null"
      >
        {{ tile.letter }}
      </div>
    </div>

    <div v-if="verdict" class="reveal" role="status" aria-live="polite">
      <p class="reveal__word">
        <strong lang="en">{{ word }}</strong> — {{ meaning }}
      </p>
      <p v-if="verdict !== 'correcto' && answer && answer !== word" class="reveal__typed">
        Escribiste: {{ answer }}
      </p>
      <p v-else-if="verdict === 'correcto' && usedHint" class="reveal__typed">
        Con pista: no sube de caja, la vas a volver a ver.
      </p>
      <button class="btn btn--dark" @click="goNext">Siguiente</button>
      <p class="hint-text">o presiona Enter</p>
    </div>

    <template v-else>
      <input
        ref="inputEl"
        class="entry"
        type="text"
        :value="answer"
        maxlength="5"
        inputmode="latin"
        autocomplete="off"
        autocapitalize="characters"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="go"
        aria-label="Tu respuesta, cinco letras"
        placeholder="escribe la palabra"
        @input="onInput"
      />
      <div class="actions">
        <button class="btn btn--go" :disabled="!canSubmit" @click="submit">Comprobar</button>
        <button class="btn btn--ghost" :disabled="!canHint" @click="takeHint">Pista</button>
        <button class="btn btn--ghost" @click="giveUp">No sé</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 24px 18px;
}

.prompt {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin: 0 0 8px;
  min-height: 20px;
}

.scrambled {
  text-align: center;
  font-family: var(--mono);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.35em;
  color: var(--blue);
  margin: 0 0 14px;
}

.tiles {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
}

.tile {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 700;
  border-radius: 3px;
  border: 2px solid transparent;
  box-sizing: border-box;
  color: #fff;
}

.tile--vacia {
  border-color: var(--line);
  background: transparent;
  color: var(--ink);
}
.tile--escrita {
  border-color: var(--ink);
  background: var(--card);
  color: var(--ink);
}
.tile--pista {
  background: var(--blue);
}
.tile--correcto {
  background: var(--moss);
}
.tile--malo {
  background: var(--plum);
}

.tile--flip {
  animation: flip 0.42s ease both;
}

@keyframes flip {
  0% {
    transform: rotateX(0);
  }
  50% {
    transform: rotateX(90deg);
  }
  100% {
    transform: rotateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile--flip {
    animation: none;
  }
}

.entry {
  width: 100%;
  padding: 10px 12px;
  box-sizing: border-box;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: #fff;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 17px;
  letter-spacing: 0.18em;
  text-align: center;
  margin-bottom: 12px;
}

.entry:focus {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.reveal {
  text-align: center;
}

.reveal__word {
  font-size: 15px;
  margin: 0 0 3px;
}

.reveal__word strong {
  font-family: var(--mono);
}

.reveal__typed {
  font-size: 12px;
  color: var(--muted);
  margin: 0 0 4px;
}

.hint-text {
  font-size: 11px;
  color: var(--muted);
  margin: 8px 0 0;
}
</style>
