# RELEVO

- **Último turno:** cursor
- **Fecha:** 2026-09-03
- **Rama:** master

## Hecho en este turno
- Producción: generadas las 24 notas vacías + escritas a disco (`POST /api/notas/generar-pendientes` + `/api/sync/escribir`). Alemán y EDO reforzados con `forzar`.
- Regeneradas **22 guías MEGA** de estudio (plan día a día, hoja de trucos, contenido por sesión, flashcards, mini-exámenes). Local OneDrive + copiadas a prod en `Docs/Guias-estudio/`.
- Script enriquecido: `apps/api/scripts/generar-guias-estudio.ts`.

## A medias - CUIDADO
- Imagen Docker de prod aún no redeployada con el script nuevo (las guías se subieron por scp; las notas usaron el generador ya desplegado).
- Hay entregas vencidas marcadas pendientes en alertas (Escritura, Lab Embebidos, Quiz 1 Alemán) — no tocadas a propósito.

## Siguiente paso
- Estudiar prioridad próxima semana: Embebidos 7 sep, Alemán Examen 1 + Quiz 2 (8 sep), EDO/Arq/Escritura (10 sep).
- Opcional: redeploy API si se quiere regenerar guías desde el contenedor.

## No tocar
- Credenciales SSH / `.env` de producción.
- Entregas del usuario (no marcar como hechas sin que él lo diga).
