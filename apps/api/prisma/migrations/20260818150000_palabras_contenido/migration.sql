-- Separa las palabras totales de las que escribió el alumno.
-- Aditiva: no toca datos existentes.
ALTER TABLE "documentos" ADD COLUMN "palabrasContenido" INTEGER NOT NULL DEFAULT 0;
