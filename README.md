# Memoriza palabras para Wordle

App de repetición espaciada para memorizar las 665 palabras de 5 letras en inglés
más frecuentes, con su traducción al español.

## Correr el proyecto

```bash
npm install
npm run dev
```

## Estructura

```
src/
├── data/words.js                     Banco de palabras + índice de traducciones
├── lib/solver.js                     Colores, filtrado de candidatas y ranking de jugadas
├── composables/
│   └── useSpacedRepetition.js        Cajas de Leitner, cola de estudio, persistencia
├── components/
│   ├── StudyCard.vue                 Tarjeta de estudio (3 modos de práctica)
│   ├── ProgressPanel.vue             Métricas y distribución por cajas
│   ├── SolverPanel.vue               Sugerencias a partir de tus intentos
│   └── ExplorerPanel.vue             Filtro con pistas estilo Wordle
├── assets/tokens.css                 Variables de diseño y botones compartidos
└── App.vue                           Pestañas y composición

scripts/smoke.mjs                     Prueba de humo del repaso y del motor de sugerencias
```

## Cómo funciona el estudio

Cajas de Leitner con seis niveles. Cada acierto sube la palabra una caja y aleja su
próximo repaso; cada fallo la devuelve a la caja 0.

| Caja | Próximo repaso |
| ---- | -------------- |
| 0    | inmediato      |
| 1    | 10 minutos     |
| 2    | 1 día          |
| 3    | 3 días         |
| 4    | 1 semana       |
| 5    | dominada       |

Cada tanda son 20 palabras: primero las vencidas (más antiguas primero), y se
completa con palabras nuevas.

**Acertar con pista no sube de caja.** La respuesta salió de la muleta, no de la
memoria, así que la palabra se queda donde está y vuelve a aparecer. Sin esta
regla el sistema te daría por dominada una palabra que no sabes.

## Modos de práctica

- **Del español** — te da el significado, escribes la palabra en inglés.
- **Anagrama** — te da las letras revueltas, las ordenas.
- **Con pistas** — te da dos letras en su posición y el significado.
- **Mixto** — elige uno al azar en cada tarjeta. Es el que mejor funciona.

El botón **Pista** descubre hasta dos casillas (primera, última, centro), saltando
las que el modo «con pistas» ya regaló.

## Resolver: qué jugar ahora

Metes los intentos que ya hiciste con sus colores y la app te dice qué conviene
jugar. Opcionalmente puedes escribir la **palabra del día** y entonces pinta ella
sola los colores de cada intento — útil para practicar. Las sugerencias se
calculan **solo con los intentos**, nunca con esa palabra: es un corrector de
colores, no un soplón.

Cada palabra candidata se agrupa por el color que devolvería si fuera la
respuesta. De ahí salen las dos métricas:

- **Descartar letras** — ordena por letras aún sin probar que el intento pone a
  prueba, pesando cuánto aparece cada una entre las candidatas. Es lo que quieres
  cuando todavía vas a ciegas.
- **Descartar palabras** — ordena por cuántas palabras quedarían en promedio
  (Σ nᵢ²/N). Es la métrica correcta cuando ya quedan pocas.

Cada sugerencia va marcada como **puede ganar** (aún podría ser la respuesta) o
**sonda** (no puede ganar, pero parte mejor el conjunto). Con «Solo posibles»
juegas en modo difícil, sin sondas.

Sin pistas, el motor propone `STARE`, `ARISE`, `RAISE` y `TRACE`, que son los
mejores arranques conocidos para listas de este tipo. Siguiendo siempre la
sugerencia de arriba resuelve el banco entero en 4 intentos o menos, con una
media de 3.

Dos reglas del ranking que existen por algo:

- Una **sonda solo aparece si parte el conjunto estrictamente mejor** que
  cualquier palabra que además podría ganar. Empatar no basta: con dos
  candidatas hay decenas de sondas que separan igual de bien, y la lista se
  llenaba de palabras que no pueden terminar la partida.
- Aun así, **siempre queda sitio para dos palabras que puedan ganar**. A veces
  las sondas copan los ocho puestos, y una lista de la que no se puede salir
  ganando no sirve de nada.

## Notas de implementación

- El progreso vive en `localStorage` bajo la clave `memoriza-wordle:v1`. Si el
  navegador lo bloquea, la app sigue funcionando en memoria y avisa.
- Los tokens de diseño están en un CSS global porque `<style scoped>` no comparte
  variables entre componentes.
- `App.vue` combina palabra e intento en la `key` de `StudyCard` para forzar el
  remontaje en cada tarjeta, en vez de resetear estado a mano. El contador
  `attempt` es necesario: si fallas la última palabra de la tanda, esa palabra
  vuelve a quedar al frente de la cola y `currentWord` no cambia — solo con la
  palabra en la `key`, la tarjeta se quedaba congelada mostrando el resultado.
- Los inputs sanitizan el texto y lo escriben de vuelta en el DOM. Si un carácter
  descartado deja el valor igual, Vue no re-renderiza y el `<input>` se quedaría
  mostrando lo que el modelo ya rechazó.
- Un `localStorage` con JSON corrupto se descarta y se sigue guardando; solo se
  considera «sin almacenamiento» cuando el navegador lo bloquea de verdad.
- `solver.js` no importa Vue a propósito: así `scripts/smoke.mjs` lo prueba desde
  Node sin montar nada.
- El patrón de colores se codifica como un entero en base 3 (0–242) en vez de un
  array. `rankGuesses` lo usa como índice de bucket cientos de miles de veces por
  ranking y ahorrarse el array importa: el primer movimiento son 665×665 pares.
- El ranking del primer movimiento se cachea. Es el único caso caro (~65 ms);
  después del primer intento las candidatas caen a unas decenas y es instantáneo.
- Un color gris **no** descarta la letra si el mismo intento la pintó verde o
  amarilla en otra posición: ahí significa «no hay más copias». Por eso
  `knownLetters` recoge primero todas las presentes y solo después marca
  ausencias.

## Verificar

```bash
npm run smoke
```

Comprueba los invariantes del sistema de repaso: que la tarjeta no se congele al
fallar la última palabra de la tanda, que una pista impida la promoción de caja,
que un `localStorage` corrupto no deje la app sin guardar, y que la racha de días
solo cuente días consecutivos.

Y los del motor de sugerencias: los colores con letras repetidas (`SPEED`,
`GEESE`, `LEVEL`, `EERIE`), que el filtro conserve la respuesta para las 665
palabras del banco, que un gris de una repetida no descarte la letra, que la
lista siempre ofrezca alguna palabra que pueda ganar, y que jugando siempre la
sugerencia de arriba se resuelva en 6 intentos o menos.

## Despliegue

Cada push a `main` construye el sitio y lo publica en GitHub Pages
(`.github/workflows/deploy.yml`). Para activarlo la primera vez:
**Settings → Pages → Source: GitHub Actions**.

`vite.config.js` usa `base: './'`, así que las rutas funcionan igual bajo
`/<repo>/` que en la raíz de un dominio propio.
