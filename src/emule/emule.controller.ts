import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EmuleService } from './emule.service';
import { SearchDto } from './dto/search.dto';
import { JobData } from './entity/JobData.class';

@Controller('emule')
export class EmuleController {
    constructor(private emuleService: EmuleService) { }

    @Get("search/:keyword")
    async search(@Param() params: any) {
        console.log(params.keyword);
        let archivos = [];
        const archivo = {
            "hash": "01010101010101",
            "nombre": "ejemploArchivo01",
            "size": "0",
            "sources": "1"
        }
        archivos[0] = archivo;
        const resultrequest = await this.emuleService.makeSearch(params.keyword);
        return archivos;
    }
    @Post("search")
    async searchTest(@Body() searchDto: SearchDto) {
        const keyword = searchDto.keyword;
        console.log(`Request POST searchTest: keyworkd ${keyword}`);
        const jobData = new JobData("search", keyword)
        return this.emuleService.processSearchQueue(jobData);
    }
}