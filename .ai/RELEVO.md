# RELEVO

- **Último turno:** cursor
- **Fecha:** 2026-09-06
- **Rama:** master

## Hecho en este turno
- Guías PDF en la app: `/api/guias-examen` lista/sirve `.pdf` + `.docx` (badge «PDF · papel»).
- EDO Examen 1 (papel, 10-sep): guía MEGA LaTeX → `PARCIAL-Examen-1-PAPEL-RESUELTO.pdf` en Guias-estudio (local + prod).
  - Tareas 1–4 + clases; T3.6–T3.9 resueltos; árbol separable/lineal/exacta; técnica a papel.
- Fuentes EDO copiadas a `Entregas/Tareas-enunciados` y `Docs/Fuentes-clase`.
- Embebidos: `Banco-Ejercicios-Evaluacion-1-RESUELTO.pdf` subido a prod Guias-estudio.
- Deploy school + Traefik school.yml asegurado.

## A medias - CUIDADO
- nada

## Siguiente paso
- Estudiar EDO con el PDF (prioridad T3.6–9 + árbol + mini simulacro).
- Embebidos: PDF del banco ya visible en Exámenes tras hard refresh.

## No tocar
- `deploy/.env` y `data/` en el servidor.
- No renombrar los PDF `*-PAPEL-RESUELTO` / `Banco-*` a `PARCIAL-….docx` (el auto-ciclo pisaría docx).
