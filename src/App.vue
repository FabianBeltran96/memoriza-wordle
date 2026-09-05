<script setup>
import { ref, onMounted } from 'vue'
import { ALL_WORDS } from './data/words.js'
import { useSpacedRepetition } from './composables/useSpacedRepetition.js'
import StudyCard from './components/StudyCard.vue'
import ProgressPanel from './components/ProgressPanel.vue'
import ExplorerPanel from './components/ExplorerPanel.vue'

const TABS = [
  { id: 'estudiar', label: 'Estudiar' },
  { id: 'progreso', label: 'Progreso' },
  { id: 'explorar', label: 'Explorar' },
]

const MODES = [
  { id: 'mixto', label: 'Mixto' },
  { id: 'traduccion', label: 'Del español' },
  { id: 'anagrama', label: 'Anagrama' },
  { id: 'patron', label: 'Con pistas' },
]

const tab = ref('estudiar')
const mode = ref('mixto')
const session = ref({ seen: 0, right: 0 })

const {
  queue,
  attempt,
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
  dayStreak,
  dueCount,
  boxCounts,
  hardestWords,
} = useSpacedRepetition()

onMounted(() => {
  load()
  buildQueue()
})

function onGraded(wasRight, usedHint) {
  grade(currentWord.value, wasRight, usedHint)
  session.value = {
    seen: session.value.seen + 1,
    right: session.value.right + (wasRight ? 1 : 0),
  }
}

function onNext(wasRight) {
  advance(wasRight)
}

function onReset() {
  reset()
  session.value = { seen: 0, right: 0 }
}

const totalWords = ALL_WORDS.length
</script>

<template>
  <div class="app">
    <div class="shell">
      <header class="header">
        <h1 class="title">Memoriza palabras para Wordle</h1>
        <p class="subtitle">{{ totalWords }} palabras de 5 letras en inglés, con su significado</p>
      </header>

      <nav class="tabs">
        <button
          v-for="item in TABS"
          :key="item.id"
          class="tab"
          :class="{ 'tab--active': tab === item.id }"
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
      </nav>

      <template v-if="tab === 'estudiar'">
        <div class="modes">
          <button
            v-for="item in MODES"
            :key="item.id"
            class="chip"
            :class="{ 'chip--active': mode === item.id }"
            @click="mode = item.id"
          >
            {{ item.label }}
          </button>
        </div>

        <StudyCard
          v-if="currentWord"
          :key="`${currentWord}#${attempt}`"
          :word="currentWord"
          :mode="mode"
          @graded="onGraded"
          @next="onNext"
        />

        <div v-else class="empty-state">
          <p>No hay palabras pendientes ahora.</p>
          <button class="btn btn--go" @click="buildQueue">Armar otra tanda</button>
        </div>

        <div class="session">
          <span>En la tanda: {{ queue.length }}</span>
          <span>Sesión: {{ session.right }}/{{ session.seen }}</span>
          <span>Vencidas: {{ dueCount }}</span>
        </div>

        <p v-if="!storageAvailable" class="warning">
          No se pudo guardar el progreso en este navegador. Se mantiene solo durante esta sesión.
        </p>
      </template>

      <ProgressPanel
        v-else-if="tab === 'progreso'"
        :mastered-count="masteredCount"
        :started-count="startedCount"
        :accuracy="accuracy"
        :day-streak="dayStreak"
        :box-counts="boxCounts"
        :hardest-words="hardestWords"
        @reset="onReset"
      />

      <ExplorerPanel v-else :box-of="boxOf" />
    </div>
  </div>
</template>

<style scoped>
.app {
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 24px 16px 32px;
  box-sizing: border-box;
}

.shell {
  width: 100%;
  max-width: 470px;
}

.header {
  margin-bottom: 18px;
}

.title {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
}

.subtitle {
  font-size: 13px;
  color: var(--muted);
  margin: 3px 0 0;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.tab {
  padding: 9px 14px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab--active {
  color: var(--ink);
  font-weight: 600;
  border-bottom-color: var(--blue);
}

.modes {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 16px;
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

.empty-state {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 26px;
  text-align: center;
}

.empty-state p {
  margin: 0 0 14px;
  font-size: 15px;
}

.session {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
  margin-top: 14px;
  padding: 0 2px;
}

.warning {
  font-size: 11px;
  color: var(--amber);
  margin-top: 10px;
}
</style>
