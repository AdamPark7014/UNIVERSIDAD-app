# RELEVO

- **Último turno:** cursor
- **Fecha:** 2026-09-06
- **Rama:** master

## Hecho en este turno
- Motor de automatización del caso de uso personal (`/api/automatizacion`):
  - ciclo cada 3 min: escribe pendientes → notas post-clase → plantillas 14 días → guías MEGA (máx 1×/12h)
  - zona `America/Mexico_City`
- Plantillas Guía/Notas desde horario (`POST /automatizacion/preparar-plantillas`)
- Guías MEGA por API (`POST /automatizacion/generar-guias`) + botón en Exámenes
- Panel Automatización en Panel y Sync; `AUTO_CICLO=true` en docker-compose prod
- Desplegado en school

## A medias - CUIDADO
- nada

## Siguiente paso
- En local con OneDrive: dejar `AUTO_CICLO=true` + `VIGILAR_DISCO=true` (encender.ps1)
- Probar «Correr ciclo ahora» en el panel
- Después: TTS desde sesión, detección de entregas en carpeta, multi-usuario escuela

## No tocar
- `deploy/.env` y `data/` en el servidor.
