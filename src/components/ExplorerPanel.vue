<script setup>
import { ref, computed } from 'vue'
import { ALL_WORDS, MEANINGS, LETTER_FREQUENCY } from '../data/words.js'
import { MASTER_BOX } from '../composables/useSpacedRepetition.js'

const props = defineProps({
  boxOf: { type: Function, required: true },
})

const greens = ref(['', '', '', '', ''])
const yellows = ref('')
const grays = ref('')

const hasFilters = computed(
  () => greens.value.some(Boolean) || yellows.value.length > 0 || grays.value.length > 0,
)

const onlyLetters = (value) => value.replace(/[^a-zA-Z]/g, '').toUpperCase()

function setGreen(index, event) {
  greens.value[index] = onlyLetters(event.target.value).slice(0, 1)
}

/** Filtra el banco con las mismas reglas del Wordle: verdes, amarillas y grises. */
const matches = computed(() => {
  const fixed = greens.value
  const present = [...new Set(yellows.value)]
  const banned = [...new Set(grays.value)]

  return ALL_WORDS.filter((word) => {
    for (let i = 0; i < 5; i++) {
      if (fixed[i] && word[i] !== fixed[i]) return false
    }
    for (const letter of present) {
      if (!word.includes(letter)) return false
    }
    for (const letter of banned) {
      // Una letra puede ser gris en una posición y verde/amarilla en otra.
      if (fixed.includes(letter) || present.includes(letter)) continue
      if (word.includes(letter)) return false
    }
    return true
  })
})

const maxFrequency = LETTER_FREQUENCY[0]?.[1] ?? 1

function clearFilters() {
  greens.value = ['', '', '', '', '']
  yellows.value = ''
  grays.value = ''
}
</script>

<template>
  <section>
    <p class="intro">
      Practica el momento difícil del Wordle: ya tienes algunas pistas y necesitas ver qué palabras
      encajan.
    </p>

    <h2 class="label label--green">Letras verdes (posición exacta)</h2>
    <div class="greens">
      <input
        v-for="(letter, i) in greens"
        :key="i"
        class="green-box"
        :class="{ 'green-box--set': letter }"
        type="text"
        maxlength="1"
        :value="letter"
        @input="setGreen(i, $event)"
      />
    </div>

    <div class="filters">
      <div class="filter">
        <h2 class="label label--yellow">Amarillas (están, pero no ahí)</h2>
        <input
          class="text-input"
          type="text"
          :value="yellows"
          placeholder="ej. AER"
          @input="yellows = onlyLetters($event.target.value)"
        />
      </div>
      <div class="filter">
        <h2 class="label label--gray">Grises (descartadas)</h2>
        <input
          class="text-input"
          type="text"
          :value="grays"
          placeholder="ej. STON"
          @input="grays = onlyLetters($event.target.value)"
        />
      </div>
    </div>

    <div class="results-head">
      <span>{{ matches.length }} palabra(s) encajan</span>
      <button v-if="hasFilters" class="link" @click="clearFilters">limpiar filtros</button>
    </div>

    <div class="results scrollable">
      <div
        v-for="word in matches.slice(0, 200)"
        :key="word"
        class="result"
        :class="{ 'result--mastered': props.boxOf(word) >= MASTER_BOX }"
      >
        <span class="result__word">{{ word }}</span>
        <span class="result__meaning">{{ MEANINGS[word] }}</span>
      </div>
      <p v-if="!matches.length" class="empty">Ninguna palabra del banco cumple esas pistas.</p>
    </div>

    <h2 class="heading">Letras más frecuentes del banco</h2>
    <div class="freq">
      <div v-for="[letter, count] in LETTER_FREQUENCY.slice(0, 12)" :key="letter" class="freq-row">
        <span class="freq-row__letter">{{ letter }}</span>
        <div class="track">
          <div class="fill" :style="{ width: `${(count / maxFrequency) * 100}%` }" />
        </div>
        <span class="freq-row__count">{{ count }}</span>
      </div>
    </div>
    <p class="note">
      Prioriza estas letras en tus primeros intentos: cubren más palabras posibles.
    </p>
  </section>
</template>

<style scoped>
.intro {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.55;
  margin: 0 0 16px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  margin: 0 0 7px;
}
.label--green {
  color: var(--moss);
}
.label--yellow {
  color: var(--amber);
}
.label--gray {
  color: var(--muted);
}

.greens {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.green-box {
  width: 44px;
  height: 44px;
  text-align: center;
  border-radius: 4px;
  border: 2px solid var(--line);
  background: #fff;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 19px;
  font-weight: 700;
  box-sizing: border-box;
}

.green-box--set {
  border-color: var(--moss);
  background: var(--moss);
  color: #fff;
}

.green-box:focus,
.text-input:focus {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter {
  flex: 1 1 140px;
}

.text-input {
  width: 100%;
  padding: 9px 10px;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 15px;
  letter-spacing: 0.15em;
}

.results-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--muted);
  border-top: 1px solid var(--line);
  padding-top: 10px;
  margin-bottom: 8px;
}

.link {
  border: none;
  background: none;
  color: var(--blue);
  font-family: inherit;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.results {
  max-height: 260px;
  margin-bottom: 24px;
}

.result {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.result--mastered {
  background: rgba(64, 115, 75, 0.08);
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

.heading {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 9px;
}

.freq {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.freq-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.freq-row__letter {
  width: 16px;
  font-family: var(--mono);
  font-weight: 700;
  font-size: 13px;
}

.freq-row__count {
  font-size: 11px;
  color: var(--muted);
  width: 30px;
  text-align: right;
}

.track {
  flex: 1;
  height: 9px;
  background: var(--track);
  border-radius: 2px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--blue);
}

.note {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.55;
  margin: 10px 0 0;
}

.empty {
  font-size: 13px;
  color: var(--muted);
  margin: 10px 2px;
}
</style>
