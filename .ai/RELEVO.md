# RELEVO

- **Último turno:** cursor
- **Fecha:** 2026-09-05
- **Rama:** master

## Hecho en este turno
- Pulido UX: sidebar agrupada, home con prioridad a exámenes, chips/estados, tablas más claras.
- Extra: atajo buscar Ctrl+K en Windows, cabeceras sticky, SeccionCabecera en Exámenes/Entregas.
- Arreglado 404 público: faltaba `school.yml` en `/opt/traefik/config/` (contenedores OK).
- Script `deploy/asegurar-traefik-school.sh` + nota en docker-compose.
- Desplegado en prod; `/`, `/examenes`, `/api/salud` → 200.

## A medias - CUIDADO
- nada

## Siguiente paso
- Hard refresh en https://school.adam.delpozodelvalle.com
- Tras cada deploy: `bash deploy/asegurar-traefik-school.sh` en el servidor

## No tocar
- `deploy/.env` y `data/` en el servidor.
