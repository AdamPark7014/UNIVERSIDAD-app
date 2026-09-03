#!/usr/bin/env python3
import sqlite3
import urllib.request

c = sqlite3.connect("/var/www/universidad-app/data/universidad.db")
row = c.execute(
    "select id, titulo, ruta from libros where archivo like '%Deutsch im Blick%'"
).fetchone()
print("libro:", row)
if not row:
    raise SystemExit(1)
url = f"http://universidad-api:4180/api/libros/{row[0]}/archivo"
# From host via traefik public URL
url_public = f"https://school.adam.delpozodelvalle.com/api/libros/{row[0]}/archivo"
req = urllib.request.Request(url_public, method="HEAD")
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print("status", r.status)
        print("content-type", r.headers.get("Content-Type"))
        print("content-disposition", r.headers.get("Content-Disposition"))
        print("content-length", r.headers.get("Content-Length"))
except Exception as e:
    print("ERROR", e)
    # fallback: docker exec curl
    import subprocess

    out = subprocess.check_output(
        [
            "docker",
            "exec",
            "universidad-api",
            "node",
            "-e",
            f"fetch('http://127.0.0.1:4180/api/libros/{row[0]}/archivo').then(async r=>{{console.log(r.status,r.headers.get('content-type')); const b=Buffer.from(await r.arrayBuffer()); console.log('bytes',b.length,'magic',b.slice(0,5).toString());}}).catch(e=>console.error(e))",
        ],
        text=True,
    )
    print(out)
