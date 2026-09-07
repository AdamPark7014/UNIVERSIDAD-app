# RELEVO

- **Último turno:** claude-code
- **Fecha:** 2026-09-07
- **Rama:** master

## Hecho en este turno

Turno de **verificación y corrección**, no de creación: Cursor ya había hecho
las dos guías y el deploy. Se comprobó todo de punta a punta antes de tocar nada.

- **Verificado que lo de Cursor está bien y publicado.** Los dos PDF están en
  prod con SHA-256 idéntico al local, y el API los sirve:
  - `emb` → `Banco-Ejercicios-Evaluacion-1-RESUELTO.pdf` (786 KB, 24 págs)
  - `ecu` → `PARCIAL-Examen-1-PAPEL-RESUELTO.pdf` (354 KB, 17 págs)
  - `GET /api/guias-examen` devuelve **24 guías** ordenadas por cercanía, con
    `diasRestantes` y `evaluacionTitulo` correctos.
  - Público OK por HTTPS en `school.adam.delpozodelvalle.com`.
- **Bug encontrado y corregido en la guía de EDO.** El `.tex` traía
  `\usepackage[T1]{fontenc}` **sin** `lmodern`, así que LaTeX caía a fuentes de
  mapa de bits: el PDF salía en **Type 3**, borroso al imprimir y sin capa de
  texto buscable (`pdftotext` devolvía basura tipo «vinelX» por «Lineal:»).
  Se añadió `\usepackage{lmodern}`; ahora son **Type 1 vectoriales con Unicode**
  y el texto se extrae bien. Recompilado, publicado y desplegado por `scp`.
  Verificado que el endpoint público ya sirve la versión corregida.

## Nota para el que entre

El prefijo real del API es **`/api`**, no la raíz: `GET /guias-examen` da 404.
Y el contenedor **no tiene `wget` ni `curl`**; para probar desde dentro:
`docker exec universidad-api node -e 'fetch("http://127.0.0.1:4180/api/...")'`.

Los PDF y los `.tex` **no viven en el repo**: están en OneDrive bajo `DOCS_ROOT`
y se despliegan con `scp` a `/var/www/universidad-app/data/docs/2026-Semestre-5/`.
Por eso un commit aquí casi nunca los incluye.

## A medias - CUIDADO
- nada

## Siguiente paso
- **Hoy 7-sep 18:00: Evaluación 1 de Embebidos (LA207).** La guía cubre la
  unidad 1 completa; el banco del profesor es solo combinacional, así que lo
  secuencial (flip-flop D, reset síncrono/asíncrono, contador, registro de
  desplazamiento) está en la sección 6 de la guía y hay que repasarlo.
- **10-sep: Examen 1 de EDO (HU325), 20%.** Prioridad: T3.6–9 en blanco, árbol
  de decisión y el simulacro cronometrado del PDF.
- Ese mismo 10-sep caen también Arquitecturas (HU413) y Escritura (HU109), que
  **no tienen guía resuelta todavía**. Si hace falta, replicar el mismo montaje.
- Aplicar el mismo arreglo de `lmodern` si aparece otro `.tex` con `fontenc`
  suelto.

## No tocar
- `deploy/.env` y `data/` en el servidor.
