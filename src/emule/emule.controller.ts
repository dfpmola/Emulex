import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { EmuleService } from './emule.service';
import { SearchDto } from './dto/search.dto';
import { JobData } from './entity/JobData.class';
import { query } from 'express';

@Controller('emule')
export class EmuleController {
    constructor(private emuleService: EmuleService) { }

    @Get("search/:keyword/:priority")
    async search(@Param() searchDto: SearchDto) {
        const keyword = searchDto.keyword;
        console.log(`Request POST searchTest: keyworkd ${keyword}`);
        const jobData = new JobData("search", keyword)
        return this.emuleService.processSearchQueue(jobData, searchDto.priority);
    }
    @Post("search")
    async searchTest(@Body() searchDto: SearchDto) {


        const keyword = searchDto.keyword;
        console.log(`Request POST searchTest: keyworkd ${keyword}`);
        const jobData = new JobData("search", keyword)
        const data = await this.emuleService.processSearchQueue(jobData, searchDto.priority);
        return data

        /*
        return JSON.parse("[{\"urled2k\":\"ed2k://|file|Hazbin%20Hotel%20-%2001x01%20-%20Obertura%20[1080p%20h264]%20[[spa,%20spa,%20eng]]%20subs[[spa,%20spa,%20spa,%20spa,%20eng,%20eng]].mkv|1483078484|6F590EB5F2E99CB6ED3C2C4D12F42614|/\",\"hash\":\"6F590EB5F2E99CB6ED3C2C4D12F42614\",\"nameFile\":\"Hazbin Hotel - 01x01 - Obertura [1080p h264] [[spa, spa, eng]] subs[[spa, spa, spa, spa, eng, eng]].mkv\",\"size\":\"1483078484\",\"peers\":\"32\",\"seeds\":\"29\"},{\"urled2k\":\"ed2k://|file|Hazbin.Hotel.1x01.Ouverture.ITA.WEBRip.x264-ZoDD.mkv|224186992|6B72C17B3760FB233713A2EE05D36EB7|/\",\"hash\":\"6B72C17B3760FB233713A2EE05D36EB7\",\"nameFile\":\"Hazbin.Hotel.1x01.Ouverture.ITA.WEBRip.x264-ZoDD.mkv\",\"size\":\"224186992\",\"peers\":\"23\",\"seeds\":\"23\"},{\"urled2k\":\"ed2k://|file|Hazbin%20Hotel%20-%2001x01%20-%20Obertura.mkv|298616182|0B7355EA45586887CC0C18D06BFFA60A|/\",\"hash\":\"0B7355EA45586887CC0C18D06BFFA60A\",\"nameFile\":\"Hazbin Hotel - 01x01 - Obertura.mkv\",\"size\":\"298616182\",\"peers\":\"2\",\"seeds\":\"1\"}]");
        */

        //
    }
    @Get("status")
    async checkStatus(@Res() response) {
        console.log(`Request GET checkStatus `);
        const jobData = new JobData("checkStatus", "")
        const statusCode = await this.emuleService.processRequestQueue(jobData, 5);
        const responseCode = statusCode === 503 ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;
        return response.status(responseCode).send();
    }
    @Get("ed2k")
    async getEd2k(@Query() query: { link: string }) {
        return (`<a href="${query.link}">${query.link}</a>`);

    }
}