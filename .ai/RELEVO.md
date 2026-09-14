# RELEVO

- **Último turno:** claude-code
- **Fecha:** 2026-09-14
- **Rama:** master

## Hecho en este turno
- `relevo salvar` rescató en `46bfec1` lo que el turno anterior dejó sin commitear
  (`.cursor/rules/*`, `apps/api/src/docx/docx.service.ts`, `.ai/index/`). No se tocó.
- Guía LaTeX del **Primer parcial de Estructuras de Datos (CN122)**, examen hoy 14-sep:
  `OneDrive/Documentos/Universidad/2026-Semestre-5/02-Estructuras-de-Datos-CN122/Latex/Guia-Parcial-1/`
  - `Guia-Parcial-1-EDD.tex` (principal) + `teoria.tex`, `banco-teoria.tex`, `clave-banco.tex`.
  - `compilar.ps1 [-Publicar]` → copia a `Docs/Guias-estudio/PARCIAL-Primer-parcial-GUIA-RESUELTA.pdf`
    (la app la lista como tipo PARCIAL).
  - Alcance: sesiones 1–11 (guías del profe + notas + Actividades 1 y 2). Teoría para las 5–8
    preguntas objetivas, banco de 77 reactivos, simulacro con clave. Todas las respuestas numéricas
    y trazas se verificaron compilando el código en C con gcc de 64 bits.
- **Desplegada en prod** (Hetzner, `-p 2222`): se creó
  `/var/www/universidad-app/data/docs/2026-Semestre-5/02-Estructuras-de-Datos-CN122/Docs/Guias-estudio/`
  (1001:1001, 755) y se instaló el PDF (1001:1001, 644). SHA-256 idéntico al local
  (`1433ccae…c1d4f1`). `GET /api/guias-examen?materia=edd` → 1 guía tipo PARCIAL;
  `GET /api/guias-examen/edd/PARCIAL-Primer-parcial-GUIA-RESUELTA.pdf` → 200 `application/pdf`,
  556 909 bytes. Sin reinicio de contenedores: la API lee la carpeta en cada petición.
- Este repo solo cambia en este archivo: la guía vive en OneDrive y en `data/docs` del servidor, no en git.

## A medias - CUIDADO
- nada.

## Siguiente paso
- En prod la guía sale con `fecha: null`: no hay evaluación «Primer parcial» de CN122 en la BD
  (tampoco en la local), así que no muestra días restantes. Darla de alta si Adam quiere el contador.
- Las guías LaTeX anteriores (EDO) definen las cajas `tcolorbox` con título opcional `[1][]` pero las
  usan con `{...}`: el título sale como texto normal. En la guía de EDD ya se corrigió con `[1]`.
- Parcial 2 de EDD: colas circulares, colas de prioridad y listas ligadas (sesiones 12–21).

## No tocar
- `deploy/.env` y la BD `data/universidad.db` en el servidor. En `data/docs/` solo se agregan guías.
