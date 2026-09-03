# RELEVO

- **Último turno:** cursor
- **Fecha:** 2026-09-03
- **Rama:** master

## Hecho en este turno
- UI: materias muestran **nombre + Salón** (ya no solo CS109).
- Exámenes priorizados en panel y nav ("Exámenes y entregas").
- Subapartado **Guías de examen** (API `/api/guias-examen` + paneles en home/evaluaciones/materia).
- Estados de entrega editables: No entregado / En tiempo y forma / Atrasado / Calificada (también vencidas).
- Sello de origen de notas: Sistema / Tú (app) / Tú (Word).
- Pronunciación alemán (Web Speech de-DE) en materia Alemán y sesiones.
- Tipografía y biblioteca más amplias.

## A medias - CUIDADO
- Cambios de API/UI **en local**; producción aún con imagen anterior (guías sí están en disco de prod, pero el endpoint `/guias-examen` y la UI nueva requieren redeploy).
- Marcar origen GENERADO en prod DB pendiente si no se alcanzó en este turno.

## Siguiente paso
- Redeploy universidad-api + universidad-web a Hetzner para llevar UI/API.
- Opcional: voces alemanas de Windows si el TTS no suena.

## No tocar
- Credenciales SSH / `.env` de producción.
