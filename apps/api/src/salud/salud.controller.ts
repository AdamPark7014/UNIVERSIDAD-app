import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import { PrismaService } from '../prisma/prisma.service';
import config from '../config';

@Controller('salud')
export class SaludController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(config.KEY) private readonly cfg: ConfigType<typeof config>,
  ) {}

  /** Diagnóstico de arranque: base, carpeta de documentos y datos cargados. */
  @Get()
  async salud() {
    const problemas: string[] = [];

    let base = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      base = true;
    } catch (e: any) {
      problemas.push(`Base de datos: ${e.message}`);
    }

    let carpeta = false;
    try {
      const st = await fs.stat(this.cfg.raizDocumentos);
      carpeta = st.isDirectory();
      if (!carpeta) problemas.push(`DOCS_ROOT no es una carpeta: ${this.cfg.raizDocumentos}`);
    } catch {
      problemas.push(`No existe DOCS_ROOT: ${this.cfg.raizDocumentos}`);
    }

    let semestre = null as any;
    let conteos = { materias: 0, sesiones: 0, documentos: 0, bloques: 0 };
    if (base) {
      semestre = await this.prisma.semestre.findUnique({
        where: { codigo: this.cfg.semestreActivo },
        select: { codigo: true, nombre: true, inicio: true, fin: true },
      });
      if (!semestre) problemas.push(`Falta el semestre ${this.cfg.semestreActivo}. Corre el seed.`);

      const [materias, sesiones, documentos, bloques] = await Promise.all([
        this.prisma.materia.count(),
        this.prisma.sesion.count(),
        this.prisma.documento.count(),
        this.prisma.bloque.count(),
      ]);
      conteos = { materias, sesiones, documentos, bloques };
      if (documentos === 0) problemas.push('No hay documentos importados. Corre POST /api/sync/importar.');
    }

    return {
      estado: problemas.length === 0 ? 'ok' : 'con-avisos',
      base,
      carpetaDocumentos: { ruta: this.cfg.raizDocumentos, existe: carpeta },
      vigilanteActivo: this.cfg.vigilarDisco,
      semestre,
      conteos,
      problemas,
    };
  }
}
