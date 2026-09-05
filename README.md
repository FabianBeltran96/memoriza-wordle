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
├── composables/
│   └── useSpacedRepetition.js        Cajas de Leitner, cola de estudio, persistencia
├── components/
│   ├── StudyCard.vue                 Tarjeta de estudio (3 modos de práctica)
│   ├── ProgressPanel.vue             Métricas y distribución por cajas
│   └── ExplorerPanel.vue             Filtro con pistas estilo Wordle
├── assets/tokens.css                 Variables de diseño y botones compartidos
└── App.vue                           Pestañas y composición
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

## Modos de práctica

- **Del español** — te da el significado, escribes la palabra en inglés.
- **Anagrama** — te da las letras revueltas, las ordenas.
- **Con pistas** — te da dos letras en su posición y el significado.
- **Mixto** — elige uno al azar en cada tarjeta. Es el que mejor funciona.

## Notas de implementación

- El progreso vive en `localStorage` bajo la clave `memoriza-wordle:v1`. Si el
  navegador lo bloquea, la app sigue funcionando en memoria y avisa.
- Los tokens de diseño están en un CSS global porque `<style scoped>` no comparte
  variables entre componentes.
- `App.vue` pasa `:key="currentWord"` a `StudyCard` para forzar el remontaje en
  cada palabra, en vez de resetear estado a mano.

## Despliegue

Cada push a `main` construye el sitio y lo publica en GitHub Pages
(`.github/workflows/deploy.yml`). Para activarlo la primera vez:
**Settings → Pages → Source: GitHub Actions**.

`vite.config.js` usa `base: './'`, así que las rutas funcionan igual bajo
`/<repo>/` que en la raíz de un dominio propio.
