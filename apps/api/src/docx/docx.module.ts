import { Global, Module } from '@nestjs/common';
import { DocxService } from './docx.service';

@Global()
@Module({
  providers: [DocxService],
  exports: [DocxService],
})
export class DocxModule {}
