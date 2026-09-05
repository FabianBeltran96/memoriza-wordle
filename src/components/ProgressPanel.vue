<script setup>
import { ALL_WORDS, MEANINGS } from '../data/words.js'
import { MASTER_BOX } from '../composables/useSpacedRepetition.js'

defineProps({
  masteredCount: { type: Number, required: true },
  startedCount: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  boxCounts: { type: Array, required: true },
  hardestWords: { type: Array, required: true },
})

const emit = defineEmits(['reset'])

const total = ALL_WORDS.length

const BOX_LABELS = [
  'Sin ver todavía',
  'Vista una vez',
  'Repaso en 1 día',
  'Repaso en 3 días',
  'Repaso en 1 semana',
  'Dominadas',
]

function confirmReset() {
  if (window.confirm('¿Borrar todo tu progreso? Esto no se puede deshacer.')) emit('reset')
}
</script>

<template>
  <section>
    <div class="metrics">
      <div class="metric">
        <span class="metric__value">{{ masteredCount }}</span>
        <span class="metric__label">dominadas</span>
      </div>
      <div class="metric">
        <span class="metric__value">{{ accuracy }}%</span>
        <span class="metric__label">de acierto</span>
      </div>
      <div class="metric">
        <span class="metric__value">{{ startedCount }}</span>
        <span class="metric__label">empezadas</span>
      </div>
    </div>

    <h2 class="heading">Dónde están tus {{ total }} palabras</h2>
    <div class="boxes">
      <div v-for="(label, i) in BOX_LABELS" :key="label" class="box-row">
        <div class="track">
          <div
            class="fill"
            :class="{ 'fill--done': i === MASTER_BOX, 'fill--none': i === 0 }"
            :style="{ width: `${(boxCounts[i] / total) * 100}%` }"
          />
        </div>
        <span class="box-row__label">{{ label }}</span>
        <span class="box-row__count">{{ boxCounts[i] }}</span>
      </div>
    </div>

    <h2 class="heading">Palabras que más te cuestan</h2>
    <div class="hardest scrollable">
      <div v-for="entry in hardestWords" :key="entry.word" class="hard-row">
        <span class="hard-row__word">{{ entry.word }}</span>
        <span class="hard-row__meaning">{{ MEANINGS[entry.word] }}</span>
        <span class="hard-row__fails">{{ entry.wrong }} fallo(s)</span>
      </div>
      <p v-if="!hardestWords.length" class="empty">
        Aún no has fallado ninguna. Aparecerán aquí cuando pase.
      </p>
    </div>

    <button class="btn btn--danger" @click="confirmReset">Borrar todo el progreso</button>
  </section>
</template>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 22px;
}

.metric {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 12px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric__value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--mono);
}

.metric__label {
  font-size: 11px;
  color: var(--muted);
}

.heading {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 10px;
}

.boxes {
  margin-bottom: 24px;
}

.box-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 6px;
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
  transition: width 0.3s ease;
}
.fill--done {
  background: var(--moss);
}
.fill--none {
  background: var(--line);
}

.box-row__label {
  font-size: 11px;
  color: var(--muted);
  width: 148px;
}

.box-row__count {
  font-size: 11px;
  font-family: var(--mono);
  width: 34px;
  text-align: right;
}

.hardest {
  max-height: 200px;
  margin-bottom: 22px;
}

.hard-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.hard-row__word {
  font-family: var(--mono);
  font-weight: 700;
}

.hard-row__meaning {
  color: var(--muted);
  font-size: 12px;
  flex: 1;
}

.hard-row__fails {
  color: var(--plum);
  font-size: 11px;
}

.empty {
  font-size: 13px;
  color: var(--muted);
  margin: 6px 2px;
}
</style>
