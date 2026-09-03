#!/usr/bin/env python3
import os
p = "/var/www/universidad-app/data/docs/2026-Semestre-5/06-Aleman-I-CS109/Libros"
print("dir exists", os.path.isdir(p))
if os.path.isdir(p):
    for name in os.listdir(p):
        full = os.path.join(p, name)
        print(repr(name), "isfile", os.path.isfile(full), "size", os.path.getsize(full) if os.path.isfile(full) else "-")
