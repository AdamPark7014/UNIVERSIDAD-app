-- CreateTable
CREATE TABLE "semestres" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "inicio" DATETIME NOT NULL,
    "fin" DATETIME NOT NULL,
    "finalesDesde" DATETIME NOT NULL,
    "finalesHasta" DATETIME NOT NULL,
    "raizDocumentos" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "dias_no_lectivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "semestreId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "motivo" TEXT NOT NULL,
    "oficial" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "dias_no_lectivos_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "materias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "semestreId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "claveOficial" TEXT,
    "profesor" TEXT,
    "aula" TEXT,
    "carpeta" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1F5F4E',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esLaboratorio" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    CONSTRAINT "materias_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bloques_horario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materiaId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "aula" TEXT,
    CONSTRAINT "bloques_horario_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "criterios_evaluacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materiaId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "porcentaje" REAL NOT NULL,
    "notas" TEXT,
    CONSTRAINT "criterios_evaluacion_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materiaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "semana" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "asistio" BOOLEAN,
    CONSTRAINT "sesiones_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sesionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "origen" TEXT NOT NULL DEFAULT 'GENERADO',
    "hash" TEXT,
    "tamanoBytes" INTEGER,
    "archivoModificadoEn" DATETIME,
    "pendienteDeEscribir" BOOLEAN NOT NULL DEFAULT false,
    "palabras" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "documentos_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bloques" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentoId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    CONSTRAINT "bloques_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tareas_propias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sesionId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "resultado" TEXT,
    "fechaLimite" DATETIME,
    "completadaEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "tareas_propias_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materiaId" TEXT NOT NULL,
    "sesionId" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" DATETIME NOT NULL,
    "peso" REAL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "calificacion" REAL,
    "entregadaEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "evaluaciones_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evaluaciones_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "libros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materiaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT,
    "anio" INTEGER,
    "isbn" TEXT,
    "editorial" TEXT,
    "ruta" TEXT,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "soloReferencia" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "notas" TEXT,
    CONSTRAINT "libros_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "eventos_sync" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iniciadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminadoEn" DATETIME,
    "resultado" TEXT NOT NULL DEFAULT 'OK',
    "direccion" TEXT NOT NULL,
    "leidos" INTEGER NOT NULL DEFAULT 0,
    "creados" INTEGER NOT NULL DEFAULT 0,
    "actualizados" INTEGER NOT NULL DEFAULT 0,
    "escritos" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "detalle" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "semestres_codigo_key" ON "semestres"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "dias_no_lectivos_semestreId_fecha_key" ON "dias_no_lectivos"("semestreId", "fecha");

-- CreateIndex
CREATE INDEX "materias_semestreId_orden_idx" ON "materias"("semestreId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "materias_semestreId_codigo_key" ON "materias"("semestreId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "bloques_horario_materiaId_diaSemana_horaInicio_key" ON "bloques_horario"("materiaId", "diaSemana", "horaInicio");

-- CreateIndex
CREATE INDEX "sesiones_fecha_idx" ON "sesiones"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_materiaId_fecha_key" ON "sesiones"("materiaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_materiaId_numero_key" ON "sesiones"("materiaId", "numero");

-- CreateIndex
CREATE INDEX "documentos_pendienteDeEscribir_idx" ON "documentos"("pendienteDeEscribir");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_sesionId_tipo_key" ON "documentos"("sesionId", "tipo");

-- CreateIndex
CREATE INDEX "bloques_documentoId_idx" ON "bloques"("documentoId");

-- CreateIndex
CREATE UNIQUE INDEX "bloques_documentoId_orden_key" ON "bloques"("documentoId", "orden");

-- CreateIndex
CREATE INDEX "tareas_propias_estado_idx" ON "tareas_propias"("estado");

-- CreateIndex
CREATE INDEX "evaluaciones_fecha_idx" ON "evaluaciones"("fecha");

-- CreateIndex
CREATE INDEX "evaluaciones_materiaId_fecha_idx" ON "evaluaciones"("materiaId", "fecha");

-- CreateIndex
CREATE INDEX "eventos_sync_iniciadoEn_idx" ON "eventos_sync"("iniciadoEn");
