-- Archivo asociado al libro. Aditiva.
-- SQLite no acepta CURRENT_TIMESTAMP como default en ADD COLUMN (no es
-- constante), por eso agregadoEn lleva una fecha fija para las filas que ya
-- existían; las nuevas las pone Prisma con @default(now()).
ALTER TABLE "libros" ADD COLUMN "archivo" TEXT;
ALTER TABLE "libros" ADD COLUMN "tamanoBytes" INTEGER;
ALTER TABLE "libros" ADD COLUMN "agregadoEn" DATETIME NOT NULL DEFAULT '2026-08-18 00:00:00';
