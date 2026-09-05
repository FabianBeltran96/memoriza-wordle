/**
 * Banco de palabras de 5 letras en inglés con su traducción al español.
 * Formato compacto: PALABRA:traducción, separadas por |
 */
const RAW = `
ABOUT:sobre|ABOVE:encima|ABUSE:abuso|ACTOR:actor|ACUTE:agudo|ADMIT:admitir|ADOPT:adoptar|ADULT:adulto|AFTER:después|AGAIN:otra vez|AGENT:agente|AGREE:estar de acuerdo|AHEAD:adelante|ALARM:alarma|ALBUM:álbum|ALERT:alerta|ALIKE:parecido|ALIVE:vivo|ALLOW:permitir|ALONE:solo|ALONG:a lo largo|ALTER:alterar|ANGEL:ángel|ANGER:ira|ANGLE:ángulo|ANGRY:enojado|APART:aparte|APPLE:manzana|APPLY:aplicar|ARENA:arena|ARGUE:discutir|ARISE:surgir|ARMED:armado|ARRAY:arreglo|ARROW:flecha|ASIDE:a un lado|ASSET:activo|AUDIO:audio|AUDIT:auditoría|AVOID:evitar|AWARD:premio|AWARE:consciente
BADGE:insignia|BAKER:panadero|BASIC:básico|BASIS:base|BEACH:playa|BEARD:barba|BEAST:bestia|BEGAN:empezó|BEGIN:empezar|BEING:ser|BELOW:abajo|BENCH:banca|BIRTH:nacimiento|BLACK:negro|BLADE:hoja|BLAME:culpa|BLANK:en blanco|BLAST:explosión|BLEND:mezcla|BLESS:bendecir|BLIND:ciego|BLOCK:bloque|BLOOD:sangre|BOARD:tabla|BOAST:presumir|BONUS:bono|BOOST:impulso|BOOTH:cabina|BOUND:limitado|BRAIN:cerebro|BRAND:marca|BRAVE:valiente|BREAD:pan|BREAK:romper|BREED:criar|BRICK:ladrillo|BRIDE:novia|BRIEF:breve|BRING:traer|BROAD:amplio|BROKE:rompió|BROWN:marrón|BRUSH:cepillo|BUILD:construir|BUILT:construido|BUNCH:manojo|BURST:estallar|BUYER:comprador
CABIN:cabaña|CABLE:cable|CANDY:dulce|CARGO:carga|CARRY:llevar|CARVE:tallar|CATCH:atrapar|CAUSE:causa|CEASE:cesar|CHAIN:cadena|CHAIR:silla|CHALK:tiza|CHARM:encanto|CHART:gráfico|CHASE:perseguir|CHEAP:barato|CHECK:revisar|CHEEK:mejilla|CHEER:animar|CHESS:ajedrez|CHEST:pecho|CHIEF:jefe|CHILD:niño|CHILL:frío|CHOIR:coro|CHOSE:eligió|CIVIC:cívico|CIVIL:civil|CLAIM:reclamo|CLASH:choque|CLASS:clase|CLEAN:limpio|CLEAR:claro|CLERK:empleado|CLICK:clic|CLIFF:acantilado|CLIMB:escalar|CLOCK:reloj|CLOSE:cerrar|CLOTH:tela|CLOUD:nube|COACH:entrenador|COAST:costa|COLOR:color|COMIC:cómico|CORAL:coral|COUCH:sofá|COUNT:contar|COURT:corte|COVER:cubrir|CRACK:grieta|CRAFT:artesanía|CRANE:grúa|CRASH:choque|CRAWL:gatear|CRAZY:loco|CREAM:crema|CRIME:crimen|CRISP:crujiente|CROSS:cruz|CROWD:multitud|CROWN:corona|CRUDE:crudo|CRUEL:cruel|CRUSH:aplastar|CURVE:curva|CYCLE:ciclo
DAILY:diario|DANCE:bailar|DEATH:muerte|DEBUT:debut|DELAY:retraso|DEPTH:profundidad|DEVIL:diablo|DIRTY:sucio|DOUBT:duda|DOZEN:docena|DRAFT:borrador|DRAIN:desagüe|DRAMA:drama|DRANK:bebió|DREAM:sueño|DRESS:vestido|DRIED:seco|DRIFT:deriva|DRILL:taladro|DRINK:bebida|DRIVE:conducir|DROVE:condujo|DROWN:ahogarse|DYING:muriendo
EAGER:ansioso|EAGLE:águila|EARLY:temprano|EARTH:tierra|EIGHT:ocho|ELDER:mayor|ELECT:elegir|EMPTY:vacío|ENEMY:enemigo|ENJOY:disfrutar|ENTER:entrar|ENTRY:entrada|EQUAL:igual|ERROR:error|EVENT:evento|EVERY:cada|EXACT:exacto|EXIST:existir|EXTRA:extra
FAITH:fe|FALSE:falso|FANCY:elegante|FATAL:fatal|FAULT:culpa|FAVOR:favor|FEAST:banquete|FENCE:cerca|FEVER:fiebre|FIBER:fibra|FIELD:campo|FIFTH:quinto|FIFTY:cincuenta|FIGHT:pelea|FINAL:final|FIRST:primero|FLAME:llama|FLASH:destello|FLEET:flota|FLESH:carne|FLOAT:flotar|FLOOD:inundación|FLOOR:piso|FLOUR:harina|FLUID:fluido|FOCUS:enfoque|FORCE:fuerza|FORGE:forjar|FORTH:adelante|FORTY:cuarenta|FORUM:foro|FOUND:encontró|FRAME:marco|FRANK:franco|FRAUD:fraude|FRESH:fresco|FRONT:frente|FROST:escarcha|FROWN:ceño fruncido|FRUIT:fruta|FULLY:completamente|FUNNY:gracioso
GIANT:gigante|GLASS:vidrio|GLOBE:globo|GLORY:gloria|GLOVE:guante|GRACE:gracia|GRADE:grado|GRAIN:grano|GRAND:grandioso|GRANT:conceder|GRAPE:uva|GRAPH:gráfica|GRASP:agarrar|GRASS:pasto|GRAVE:tumba|GREAT:genial|GREEN:verde|GREET:saludar|GRIEF:pena|GRILL:parrilla|GROSS:bruto|GROUP:grupo|GROWN:crecido|GUARD:guardia|GUESS:adivinar|GUEST:invitado|GUIDE:guía|GUILT:culpa
HABIT:hábito|HAPPY:feliz|HARSH:áspero|HASTE:prisa|HEART:corazón|HEAVY:pesado|HEDGE:seto|HELLO:hola|HENCE:por lo tanto|HOBBY:pasatiempo|HONEY:miel|HONOR:honor|HORSE:caballo|HOTEL:hotel|HOUSE:casa|HUMAN:humano|HUMOR:humor|HURRY:apurarse
IDEAL:ideal|IMAGE:imagen|IMPLY:implicar|INDEX:índice|INNER:interior|INPUT:entrada|ISSUE:asunto|IVORY:marfil
JOINT:conjunto|JUDGE:juez|JUICE:jugo
KNEEL:arrodillarse|KNIFE:cuchillo|KNOCK:golpear|KNOWN:conocido
LABEL:etiqueta|LABOR:trabajo|LARGE:grande|LASER:láser|LATER:después|LAUGH:reír|LAYER:capa|LEARN:aprender|LEASE:arriendo|LEAST:menos|LEAVE:irse|LEGAL:legal|LEMON:limón|LEVEL:nivel|LIGHT:luz|LIMIT:límite|LOCAL:local|LOGIC:lógica|LOOSE:suelto|LOWER:bajar|LOYAL:leal|LUCKY:afortunado|LUNCH:almuerzo
MAGIC:magia|MAJOR:mayor|MAKER:creador|MARCH:marzo|MATCH:partido|MAYBE:quizás|MAYOR:alcalde|MEDAL:medalla|MEDIA:medios|MERCY:misericordia|MERGE:fusionar|MERIT:mérito|METAL:metal|METER:metro|MIDST:en medio|MIGHT:poder|MINOR:menor|MINUS:menos|MIXED:mezclado|MODEL:modelo|MONEY:dinero|MONTH:mes|MORAL:moral|MOTOR:motor|MOUNT:monte|MOUSE:ratón|MOUTH:boca|MOVIE:película|MUSIC:música
NAKED:desnudo|NASTY:desagradable|NERVE:nervio|NEVER:nunca|NEWLY:recién|NIGHT:noche|NOBLE:noble|NOISE:ruido|NORTH:norte|NOVEL:novela|NURSE:enfermero
OCCUR:ocurrir|OCEAN:océano|OFFER:oferta|OFTEN:a menudo|ONION:cebolla|ORBIT:órbita|ORDER:orden|ORGAN:órgano|OTHER:otro|OUGHT:debería|OUTER:exterior|OWNER:dueño
PAINT:pintura|PANEL:panel|PANIC:pánico|PAPER:papel|PARTY:fiesta|PASTE:pasta|PATCH:parche|PAUSE:pausa|PEACE:paz|PEARL:perla|PHASE:fase|PHONE:teléfono|PHOTO:foto|PIANO:piano|PIECE:pieza|PILOT:piloto|PITCH:lanzamiento|PIZZA:pizza|PLACE:lugar|PLAIN:llano|PLANE:avión|PLANT:planta|PLATE:plato|POINT:punto|POUND:libra|POWER:poder|PRESS:prensa|PRICE:precio|PRIDE:orgullo|PRIME:primo|PRINT:imprimir|PRIOR:previo|PRIZE:premio|PROOF:prueba|PROUD:orgulloso|PROVE:probar|PULSE:pulso|PUNCH:puñetazo|PUPIL:alumno|PURSE:bolso
QUEEN:reina|QUERY:consulta|QUEST:búsqueda|QUEUE:fila|QUICK:rápido|QUIET:silencioso|QUITE:bastante|QUOTE:cita
RADIO:radio|RAISE:levantar|RANCH:rancho|RANGE:rango|RAPID:rápido|RATIO:razón|REACH:alcanzar|REACT:reaccionar|READY:listo|REALM:reino|REBEL:rebelde|REFER:referir|RELAX:relajarse|REPLY:respuesta|RIDGE:cresta|RIFLE:rifle|RIGHT:derecho|RIGID:rígido|RIVAL:rival|RIVER:río|ROAST:asar|ROBOT:robot|ROCKY:rocoso|ROMAN:romano|ROUGH:áspero|ROUND:redondo|ROUTE:ruta|ROYAL:real|RUGBY:rugby|RURAL:rural
SALAD:ensalada|SALON:salón|SANDY:arenoso|SAUCE:salsa|SCALE:escala|SCENE:escena|SCOPE:alcance|SCORE:puntaje|SCOUT:explorador|SCRAP:chatarra|SENSE:sentido|SERVE:servir|SEVEN:siete|SHADE:sombra|SHAFT:eje|SHAKE:sacudir|SHALL:deberá|SHAME:vergüenza|SHAPE:forma|SHARE:compartir|SHARK:tiburón|SHARP:afilado|SHEEP:oveja|SHEET:hoja|SHELF:estante|SHELL:concha|SHIFT:turno|SHINE:brillar|SHIRT:camisa|SHOCK:choque|SHOOT:disparar|SHORE:orilla|SHORT:corto|SIGHT:vista|SILLY:tonto|SINCE:desde|SIXTH:sexto|SIXTY:sesenta|SKILL:habilidad|SLEEP:dormir|SLICE:rebanada|SLIDE:deslizar|SMALL:pequeño|SMART:inteligente|SMELL:oler|SMILE:sonrisa|SMOKE:humo|SNAKE:serpiente|SOLAR:solar|SOLID:sólido|SOLVE:resolver|SORRY:lo siento|SOUND:sonido|SOUTH:sur|SPACE:espacio|SPARE:de repuesto|SPARK:chispa|SPEAK:hablar|SPEED:velocidad|SPELL:hechizo|SPEND:gastar|SPICE:especia|SPINE:columna|SPLIT:dividir|SPOKE:habló|SPORT:deporte|SPRAY:rociar|STACK:pila|STAFF:personal|STAGE:escenario|STAIN:mancha|STAIR:escalón|STAKE:estaca|STAMP:sello|STAND:pararse|STARE:mirar fijo|START:empezar|STATE:estado|STEAL:robar|STEAM:vapor|STEEL:acero|STEEP:empinado|STICK:palo|STIFF:rígido|STILL:todavía|STOCK:existencia|STONE:piedra|STOOD:se paró|STORE:tienda|STORM:tormenta|STORY:historia|STOVE:estufa|STRAP:correa|STRAW:paja|STRIP:tira|STUCK:atascado|STUDY:estudiar|STUFF:cosas|STYLE:estilo|SUGAR:azúcar|SUITE:suite|SUPER:súper|SWEET:dulce|SWIFT:veloz|SWING:columpio|SWORD:espada
TABLE:mesa|TASTE:sabor|TEACH:enseñar|TEETH:dientes|TENTH:décimo|THANK:agradecer|THEFT:robo|THEIR:su|THEME:tema|THERE:allí|THESE:estos|THICK:grueso|THIEF:ladrón|THING:cosa|THINK:pensar|THIRD:tercero|THOSE:esos|THREE:tres|THREW:lanzó|THROW:lanzar|THUMB:pulgar|TIGER:tigre|TIGHT:apretado|TIMER:temporizador|TITLE:título|TODAY:hoy|TOOTH:diente|TOPIC:tema|TOTAL:total|TOUCH:tocar|TOUGH:duro|TOWEL:toalla|TOWER:torre|TOXIC:tóxico|TRACE:rastro|TRACK:pista|TRADE:comercio|TRAIL:sendero|TRAIN:tren|TRASH:basura|TREAT:trato|TREND:tendencia|TRIAL:juicio|TRIBE:tribu|TRICK:truco|TRUCK:camión|TRULY:de verdad|TRUST:confianza|TRUTH:verdad|TWICE:dos veces|TWIST:torcer
UNCLE:tío|UNDER:debajo|UNION:unión|UNITY:unidad|UNTIL:hasta|UPPER:superior|UPSET:molesto|URBAN:urbano|USAGE:uso|USUAL:usual
VAGUE:vago|VALID:válido|VALUE:valor|VAPOR:vapor|VENUE:lugar|VERSE:verso|VIDEO:video|VIRUS:virus|VISIT:visitar|VITAL:vital|VOCAL:vocal|VOICE:voz
WAGON:vagón|WAIST:cintura|WASTE:desperdicio|WATCH:reloj|WATER:agua|WHEAT:trigo|WHEEL:rueda|WHERE:dónde|WHICH:cuál|WHILE:mientras|WHITE:blanco|WHOLE:entero|WHOSE:de quién|WIDOW:viuda|WIDTH:ancho|WOMAN:mujer|WORLD:mundo|WORRY:preocupación|WORSE:peor|WORST:el peor|WORTH:valor|WOULD:haría|WOUND:herida|WRIST:muñeca|WRITE:escribir|WRONG:incorrecto|WROTE:escribió
YIELD:rendir|YOUNG:joven|YOUTH:juventud
`

export const WORDS = RAW.split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .flatMap((line) => line.split('|'))
  .map((pair) => {
    const i = pair.indexOf(':')
    return { word: pair.slice(0, i).trim(), meaning: pair.slice(i + 1).trim() }
  })
  .filter((entry) => /^[A-Z]{5}$/.test(entry.word))

/** Mapa PALABRA -> traducción, para lookups O(1). */
export const MEANINGS = Object.fromEntries(WORDS.map((e) => [e.word, e.meaning]))

/** Solo las palabras, en el orden del banco. */
export const ALL_WORDS = WORDS.map((e) => e.word)

/** Cuántas palabras del banco contienen cada letra, de mayor a menor. */
export const LETTER_FREQUENCY = (() => {
  const counts = {}
  for (const word of ALL_WORDS) {
    for (const letter of new Set(word)) counts[letter] = (counts[letter] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})()
