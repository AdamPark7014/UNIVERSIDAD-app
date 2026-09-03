# UNIVERSIDAD-app

Sistema para administrar el semestre: materias, horario, sesiones, los ~500 documentos
de Word con las notas y guías, las tareas propias y las fechas de entrega.

Monorepo: Next.js (web) + NestJS (API) + Prisma + SQLite.

## Idea central

Los `.docx` viven en OneDrive y **siguen siendo la fuente de la verdad** — se pueden
abrir en Word como siempre. La base de datos guarda el contenido de cada documento
descompuesto en bloques (título, encabezado, párrafo, viñeta, separador…) para poder
editarlo desde la app, buscar, contar y dar seguimiento.

```
OneDrive\Universidad\2026-Semestre-5\<materia>\Notas\*.docx
        │                                    ▲
        │ importar (lee y clasifica)         │ escribir (regenera el .docx
        ▼                                    │  con el formato del alumno)
   SQLite      ──────────────────────────────┘
        │
        ├─ NestJS API (apps/api) …… REST + Prisma + lectura/escritura de .docx
        └─ Next.js (apps/web) ……… panel, calendario, editor embebido
```

| Ruta | Rol |
|------|-----|
| `apps/api` | NestJS 11, Prisma, parser y escritor de `.docx` |
| `apps/web` | Next.js 14 + TypeScript, sistema de diseño Nexara |
| `packages/shared` | Tipos compartidos |
| `apps/api/prisma/universidad.db` | La base. Respaldar = copiar este archivo |

**Por qué SQLite y no Postgres.** Un solo usuario, un solo equipo, y la base es un
índice sobre los `.docx` que viven en OneDrive: se regenera entera con `pnpm db:reset`.
No hay demonio que levantar, ni contraseña, ni Docker. Si algún día hace falta
Postgres, `docker-compose.dev.yml` sigue ahí: cambia el `provider` en `schema.prisma`,
devuelve los enums (en SQLite son `String`) y los tipos nativos `@db.Text`,
`@db.Date` y `@db.Decimal`.

## Arranque

Requisitos: Node >= 22 (fnm default) y pnpm >= 10.30.3. Nada mas.

```powershell
cd C:\dev\apps\UNIVERSIDAD-app
.\scripts\arrancar.ps1      # instala, migra, siembra e importa los 496 .docx
.\scripts\encender.ps1      # levanta todo y abre el navegador
```

`encender.ps1` arranca la API y la web como procesos independientes de Windows:
siguen corriendo aunque cierres la terminal. Es idempotente, asi que se puede
correr las veces que sea. Para apagar, `.\scripts\apagar.ps1`.

| Comando | Para que |
|---------|----------|
| `pnpm encender` | Enciende todo |
| `pnpm apagar` | Apaga todo |
| `.\scripts\encender.ps1 -Reconstruir` | Compila antes de arrancar |
| `pnpm dev:api` / `pnpm dev:web` | Modo desarrollo, con recarga en caliente |

O paso a paso:

```powershell
pnpm install
pnpm prisma:migrate
pnpm db:seed
pnpm sync
```

Con la API arriba, la primera importación trae los documentos del disco:

```powershell
curl.exe -X POST http://localhost:4180/api/sync/importar
# o desde la terminal, sin levantar la API:
pnpm sync
```

### Volver a empezar

La base es 100% derivable de los `.docx` y el seed, así que borrarla no pierde nada:

```powershell
pnpm db:reset    # resetea, siembra y reimporta
```

## Qué hace cada pantalla

| Pantalla | Para qué |
|----------|----------|
| **Panel** | Semana del semestre, clases de hoy, próximas entregas, tareas abiertas |
| **Buscar** | Texto completo sobre los 496 documentos, tareas y evaluaciones. `Ctrl+K` |
| **Calendario** | Abre en la semana en curso, con regleta para saltar a cualquiera |
| **Horario** | La rejilla semanal fija |
| **Materia** | Criterios, bibliografía, fechas, sesiones y exportación a un solo `.docx` |
| **Sesión** | **Guía y notas lado a lado**, con editor de texto corrido y `Ctrl+S` |
| **Tareas propias** | Todas las ideas que salieron en clase, con estado y notas de resultado |
| **Evaluaciones** | Exámenes, entregas y proyectos, con estado editable |
| **Estadísticas** | Avance de notas por materia, lo más atrasado y estado del sistema |
| **Sincronización** | Importar del disco, escribir al disco y la bitácora de cada corrida |

## Búsqueda

FTS5 de SQLite con `remove_diacritics`: **«automata» encuentra «autómata»** y
«Ubungsbuch» encuentra «Übungsbuch». Cada palabra se busca como prefijo, así que
«lema bombe» encuentra «lema del bombeo». Si el índice no devuelve nada, cae sola a
búsqueda por subcadena.

El índice es una tabla aparte que se reconstruye tras cada importación: con 12 000
bloques tarda milisegundos. Efecto colateral: `prisma migrate` la ve como un cambio
ajeno al esquema y pide resetear. Es inofensivo, pero por eso las migraciones
aditivas se escriben a mano.

## Vigilante de disco

Con `VIGILAR_DISCO=true` (por omisión) la API observa `DOCS_ROOT` y reimporta sola
cuando Word guarda un `.docx`. No hay que apretar nada.

Word no escribe el archivo en su sitio: crea un temporal y lo renombra, así que se
ven varios eventos por guardado. El vigilante espera a que el archivo se estabilice
(1.5 s) y agrupa los eventos repetidos con 2 s más de retardo. Ignora los `~$` de
bloqueo. Ponlo en `false` si OneDrive genera mucho ruido.

## Exportar para estudiar

```
GET /api/exportar/materia/teo?tipo=GUIA          # todas las guías en un .docx
GET /api/exportar/materia/teo?tipo=AMBOS         # guías + notas intercaladas
GET /api/exportar/materia/ecu?tipo=NOTAS&desde=2026-09-01&hasta=2026-10-15
GET /api/exportar/tareas                         # las tareas propias pendientes
```

El documento abre con horario, criterios de evaluación y fechas de la materia, y
sigue sesión por sesión. Los botones están en la pantalla de cada materia.

## Escribir apuntes

La pantalla de sesión abre con **la guía a la izquierda y tus notas a la derecha**,
cada panel con su propio desplazamiento. Es el modo en que se usa de verdad: leer
lo que toca mientras se escribe.

El editor es un cuadro de texto corrido, no un formulario. Cuatro convenciones
bastan para que salga un `.docx` bien formado:

| Escribes | Sale |
|----------|------|
| `# Texto` | encabezado en negrita |
| `- Texto` | viñeta |
| `---` | línea separadora |
| `* TAREA PROPIA` | abre el bloque de tareas propias |

`Ctrl+S` guarda y escribe al `.docx`, como en Word. El título y el subtítulo no se
tocan: identifican al documento y se conservan tal cual.

Quedan otros dos modos para cuando hacen falta: **Vista** muestra cómo va a quedar
la hoja, y **Bloques** permite mover cosas de sitio o cambiar un párrafo a viñeta
sin reescribirlo.

## El formato de los `.docx`

El escritor reproduce el formato exacto de los archivos del alumno:

- Hoja Carta, márgenes 2.5 cm arriba/abajo y 3 cm a los lados
- Cuerpo Arial 10, idioma es-MX
- Título Arial 12 negrita centrado, `NOTAS DD-MM-AA <Materia>`
- Subtítulo Arial 9 cursiva gris con clave, día, hora y número de sesión
- Bloque **TAREA PROPIA** separado por una línea fina

Al escribir se deja un respaldo `<archivo>.docx.bak` junto al original
(`BACKUP_ON_WRITE=true` en `.env`).

## Flujo de trabajo

1. Escribe en Word como siempre, o edita desde la app.
2. Si escribiste en Word: **Importar cambios** en Sincronización.
3. Si editaste en la app: **Guardar y escribir al .docx**.

La app solo reprocesa los archivos cuyo hash SHA-256 cambió, así que importar es
barato aunque haya 500 documentos. Los archivos de bloqueo de Word (`~$…`) se ignoran.

Las tareas propias se extraen solas: todo lo que esté debajo del bloque
`TAREA PROPIA` en un documento de notas se convierte en un registro con estado.

## API

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/api/dashboard` | Resumen del semestre |
| GET | `/api/dashboard/avance` | Avance de notas por materia |
| GET | `/api/materias` · `/api/materias/:codigo` | Materias |
| GET | `/api/sesiones` | Filtrable por materia, semana, rango de fechas, estado |
| GET | `/api/sesiones/dia/:fecha` | Todas las clases de un día |
| GET | `/api/sesiones/:id` | Sesión con documentos, bloques y tareas |
| GET | `/api/documentos/:id` | Documento con bloques y HTML de vista previa |
| GET | `/api/documentos/:id/archivo` | Descarga el `.docx` real |
| PUT | `/api/documentos/:id/bloques` | Reemplaza el contenido (no toca el disco) |
| POST | `/api/documentos/:id/guardar` | Escribe el `.docx` |
| POST | `/api/documentos/:id/recargar` | Relee el `.docx` y descarta lo de la base |
| GET/POST/PATCH/DELETE | `/api/tareas` | Tareas propias |
| GET/POST/PATCH/DELETE | `/api/evaluaciones` | Exámenes y entregas |
| GET | `/api/calendario` · `/api/calendario/horario` | Calendario y rejilla semanal |
| GET | `/api/busqueda?q=…` | Búsqueda de texto completo |
| GET | `/api/exportar/materia/:codigo` · `/api/exportar/tareas` | Compilar un `.docx` |
| GET | `/api/salud` | Diagnóstico: base, `DOCS_ROOT`, semestre y conteos |
| POST | `/api/sync/importar` · `/api/sync/escribir` | Sincronización |

## Pruebas

```powershell
pnpm test
```

19 pruebas sobre el motor de `.docx`, que es la pieza donde un error corrompe
archivos reales: clasificación de bloques, viaje redondo sin pérdida de texto,
estabilidad en dos vueltas, acentos y símbolos matemáticos, respaldo `.bak`, y
escape de HTML en la vista previa.

Dos casos existen por fidelidad con las notas escritas a mano: un párrafo que
empieza con `1.-` **no** es una lista numerada —el alumno numera dentro de párrafos
normales, y clasificarlo como lista le metería una sangría que él no puso—. Por eso
la clasificación mira el formato (sangría, viñeta, tamaño, centrado) y nunca el texto.

## Sistema de diseño

Sigue `SOFTWARE\esquemas\Nexara-sistema-diseno-y-tipografias\Nexara-sistema-de-diseno.md`:
paleta Tinta/Pino/Papel exacta, Fraunces para titulares, Inter para cuerpo y
JetBrains Mono solo para datos y etiquetas. Una sola voz fuerte, todo lo demás en silencio.

La única desviación deliberada: el espaciado de sección de 128px del documento está
pensado para una página de venta. Esto es una herramienta de trabajo y necesita
densidad, así que usa la misma escala de 8px con pasos más cortos.

## Respaldo

Este repo **no** guarda los `.docx`: apuntan a OneDrive vía `DOCS_ROOT`. Lo que hay
que respaldar aquí es el código; los documentos ya los sincroniza OneDrive.

## Una decisión de diseño que se nota al usarla

Una nota vacía de una clase **que todavía no ocurre** no es un pendiente: es lo
normal. Solo es deuda si la clase ya pasó.

Sin esa distinción, las 248 sesiones aparecían marcadas «notas vacías» y el aviso
dejaba de significar nada. Con ella, el panel señala exactamente las 2 clases que
de verdad quedaron sin apuntes. La regla vive en `estadoNotas()`
(`apps/web/src/components/FilaSesion.tsx`) y la usan el panel, el calendario y la
pantalla de cada materia.

Del mismo modo, `palabrasContenido` cuenta solo lo que escribió el alumno: descuenta
título, subtítulo, tema y la línea de ayuda de la plantilla. No corta en
`TAREA PROPIA`, porque en las notas escritas a mano ese bloque va **arriba** y los
apuntes de clase debajo — cortar ahí descartaría justo lo que se quiere contar.

## Operación

Tres scripts convierten esto en algo que no hay que atender.

| Script | Qué hace |
|--------|----------|
| `encender.ps1` | Levanta API y web como procesos independientes. Idempotente. Rota los logs que pasen de 5 MB. |
| `vigilar.ps1` | Comprueba que ambos respondan y revive lo que se haya caído. Solo escribe en la bitácora cuando actúa. |
| `respaldar.ps1` | Copia la base con `VACUUM INTO` —consistente aunque la app esté escribiendo— y rota a 14 días. |

### Que arranque solo con Windows

```powershell
.\scripts\instalar-tareas.ps1
```

Registra tres tareas bajo `\UNIVERSIDAD-app` en el Programador de tareas, a nombre
del usuario actual y **sin pedir permisos de administrador**:

| Tarea | Cuándo |
|-------|--------|
| Encender | al iniciar sesión, con 30 s de gracia |
| Vigilar | cada 10 minutos |
| Respaldar | diario a las 21:00 |

Para quitarlas: `.\scripts\instalar-tareas.ps1 -Quitar`.

### Qué se respalda y por qué

Los `.docx` **no** se respaldan aquí: viven en OneDrive y ya están replicados.
Lo que solo existe en la base y se perdería sin respaldo es:

- el estado de cada tarea propia y sus notas de resultado
- el estado y la calificación de cada evaluación
- las referencias de libros sin PDF (ISBN, editorial, enlaces)
- la bitácora de sincronizaciones

Todo lo demás —sesiones, documentos, bloques— se regenera con `pnpm db:reset`.

## Errores

Un filtro global traduce cualquier fallo a un código y un mensaje legibles, en vez
del `500 Internal server error` que no dice nada:

| Situación | Respuesta |
|-----------|-----------|
| El `.docx` está abierto en Word (`EBUSY`) | `409` — «Ciérralo y vuelve a intentar» |
| El archivo ya no está (`ENOENT`) | `404` — «El archivo ya no está en disco» |
| Falta una columna (Prisma `P2022`) | `500` — «La base está desfasada. Corre las migraciones» |
| Registro duplicado (`P2002`) | `409` |

Un interceptor anota cada mutación y toda lectura que pase de 400 ms, para que la
bitácora sirva y no sea ruido.

## Biblioteca

Los PDF viven en `<materia>\Libros\` dentro de OneDrive y se leen embebidos con el
visor del navegador —paginación, búsqueda y zoom incluidos—.

- **Buscar en disco** reescanea las carpetas y registra lo que encuentre.
- **Subir un PDF** lo copia a la carpeta de la materia, así que OneDrive lo respalda.
- **Solo la referencia** registra autor, editorial, año, ISBN y enlace, para los que
  tienes en biblioteca pero no en digital.

Quitar un libro de la lista **no borra el PDF**: es tuyo y sigue en OneDrive.

## Control de versiones

El repositorio está iniciado y `.gitignore` deja fuera la base, los respaldos, los
logs, `node_modules` y los `.env`. Falta el primer commit:

```powershell
git commit -m "UNIVERSIDAD-app: gestion del semestre"
```

Aún no tiene remoto. Si quieres respaldo fuera del disco, crea un repo privado en
GitHub y haz push.
