import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
  @Get(':category/:name')
  async serveFile(
    @Param('category') category: string,
    @Param('name') name: string,
    @Res() res: Response
  ) {
    const filePath = path.join('/tmp/autoapply-storage', category, name);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return res.sendFile(filePath);
  }
}
