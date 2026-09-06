import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocxService } from '../docx/docx.service';
import { generarGuiasEstudio, OpcionesGenerarGuias } from './generar-guias.logic';

@Injectable()
export class GuiasEstudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docx: DocxService,
  ) {}

  generar(opciones: OpcionesGenerarGuias = {}) {
    return generarGuiasEstudio(this.prisma as any, this.docx, opciones);
  }
}
