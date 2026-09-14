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
- Este repo solo cambia en este archivo: la guía vive en OneDrive, no en git.

## A medias - CUIDADO
- nada. No se subió a prod; solo quedó en OneDrive.

## Siguiente paso
- La BD local no tiene evaluaciones de CN122: la fecha del parcial no está registrada en la app.
- Las guías LaTeX anteriores (EDO) definen las cajas `tcolorbox` con título opcional `[1][]` pero las
  usan con `{...}`: el título sale como texto normal. En la guía de EDD ya se corrigió con `[1]`.
- Parcial 2 de EDD: colas circulares, colas de prioridad y listas ligadas (sesiones 12–21).

## No tocar
- `deploy/.env` y `data/` en el servidor.
