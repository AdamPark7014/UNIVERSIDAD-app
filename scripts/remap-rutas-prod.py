#!/usr/bin/env python3
"""Remapea rutas Windows de OneDrive a rutas del contenedor (/data/docs).

Se puede ejecutar en el host: comprueba existencia bajo HOST_ROOT
y guarda en la DB las rutas CONTAINER_ROOT que usa la API.
"""
import os
import sqlite3
import sys

HOST_ROOT = "/var/www/universidad-app/data/docs/2026-Semestre-5"
CONTAINER_ROOT = "/data/docs/2026-Semestre-5"
MARKER = "2026-Semestre-5"
DB = sys.argv[1] if len(sys.argv) > 1 else "/var/www/universidad-app/data/universidad.db"


def relative_from_marker(ruta: str) -> str | None:
    n = ruta.replace("\\", "/")
    i = n.find(MARKER)
    if i < 0:
        return None
    return n[i + len(MARKER) :].lstrip("/")


def main() -> None:
    c = sqlite3.connect(DB)
    old = c.execute("select raizDocumentos from semestres").fetchone()[0]
    c.execute("update semestres set raizDocumentos=?", (CONTAINER_ROOT,))
    print(f"semestre: {old} -> {CONTAINER_ROOT}")

    ok = missing = 0
    for id_, ruta, archivo in c.execute(
        "select id, ruta, archivo from libros where ruta is not null"
    ):
        rel = relative_from_marker(ruta or "")
        if not rel:
            print(f"NO MARKER libro {archivo}: {ruta}")
            missing += 1
            continue
        host = f"{HOST_ROOT}/{rel}"
        container = f"{CONTAINER_ROOT}/{rel}"
        if os.path.isfile(host):
            c.execute("update libros set ruta=? where id=?", (container, id_))
            ok += 1
        else:
            print(f"MISSING libro {archivo}")
            print(f"  host={host}")
            missing += 1
    print(f"libros remapped ok={ok} missing={missing}")

    dok = dmiss = 0
    for id_, ruta in c.execute("select id, ruta from documentos where ruta is not null"):
        rel = relative_from_marker(ruta or "")
        if not rel:
            dmiss += 1
            continue
        host = f"{HOST_ROOT}/{rel}"
        container = f"{CONTAINER_ROOT}/{rel}"
        if os.path.isfile(host):
            c.execute("update documentos set ruta=? where id=?", (container, id_))
            dok += 1
        else:
            dmiss += 1
    print(f"documentos remapped ok={dok} missing={dmiss}")

    sample = c.execute(
        "select substr(ruta,1,90) from libros where ruta is not null limit 3"
    ).fetchall()
    print("sample:", sample)

    c.commit()
    c.close()
    print("done")


if __name__ == "__main__":
    main()
