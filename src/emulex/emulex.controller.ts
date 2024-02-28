import { Body, Controller, Get, HttpStatus, Inject, Param, Post, Query, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { CheckApiGuard } from 'src/check-api/check-api.guard';
import { EmulexServiceInterface } from './emulex.service.interface';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DownloadDto } from 'src/emule/dto/DownloadDto';
import { SearchDto } from 'src/emule/dto/search.dto';
import { JobData } from 'src/emule/entity/JobData.class';
import { OnConnectionClosed } from 'src/on-connection-closed/on-connection-closed.decorator';
import { Observable } from 'rxjs';

@UseGuards(CheckApiGuard)
@Controller('emulex')
export class EmulexController {

    constructor(
        @Inject('EmulexServiceInterface') private emulexService: EmulexServiceInterface
    ) { }

    @Get("search/:keyword/:priority")
    async search(@Param() searchDto: SearchDto) {
        const keyword = searchDto.keyword;
        console.log(`Request POST searchTest: keyworkd ${keyword}`);
        const jobData = new JobData("search", keyword)
        return this.emulexService.processSearchQueue(jobData, searchDto.priority);
    }
    @Post("search")
    async searchTest(@Body() searchDto: SearchDto) {
        const keyword = searchDto.keyword;
        console.log(`Request POST searchTest: keyworkd ${keyword}`);
        const jobData = new JobData("search", keyword)
        const data = await this.emulexService.processSearchQueue(jobData, searchDto.priority);
        return data
    }
    @Get("status")
    async checkStatus(@Res() response, @OnConnectionClosed() onClosed: Observable<void>) {
        console.log(`Request GET checkStatus `);

        onClosed.subscribe({
            complete: () => {
                console.log('Connection closed')
            },
        });



        const jobData = new JobData("checkStatus", "")
        const statusCode = await this.emulexService.processRequestQueue(jobData, 5);
        const responseCode = statusCode === 503 ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;
        return response.status(responseCode).send();
    }
    @Get("ed2k")
    async getEd2k(@Query() query: { link: string }) {
        return (`<a href="${query.link}">${query.link}</a>`);

    }

    @UseInterceptors(CacheInterceptor)
    @CacheTTL(90000)
    @Get("downloads")
    async downloads() {
        console.log(`Request GET downloads `);
        const jobData = new JobData("downloads", "")
        const filesDownloads = await this.emulexService.processRequestQueue(jobData, 8);
        return filesDownloads;
    }

    @Post("download")
    async addDownload(@Body() downloadDto: DownloadDto) {
        console.log(`Request POST addDownloads `);
        const ed2kurl = downloadDto.ed2kurl;

        const jobData = new JobData("addDownloads", ed2kurl)
        const filesDownloads = await this.emulexService.processRequestQueue(jobData, 8);
        return filesDownloads;
    }

    @Get("sharedFiles")
    async getSharedFiles() {
        console.log(`Request GET getSharedFiles `);

        const jobData = new JobData("getSharedFiles", "")
        const filesDownloads = await this.emulexService.processRequestQueue(jobData, 20);
        return filesDownloads;
    }

}
