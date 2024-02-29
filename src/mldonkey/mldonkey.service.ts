import { Injectable, OnModuleInit } from '@nestjs/common';
import { JobData } from 'src/emulex/entity/JobData.class';
import { EmulexServiceInterface } from 'src/emulex/emulex.service.interface';
import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { data } from 'cheerio/lib/api/attributes';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { AxiosError } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import parse from 'node-html-parser/dist/parse';
import { Ed2kSearch } from 'src/emulex/entity/Ed2kSearch.class';
import { Ed2kfile } from 'src/emulex/entity/Ed2kfile.class';
var path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');
const fsp = fs.promises;
const cheerio = require('cheerio');
@Injectable()
export class MldonkeyService implements OnModuleInit, EmulexServiceInterface {

    emulexRequest: Queue;
    baseUrl: string = this.configService.get<string>('EMULE_URL_PORT');
    user: string = this.configService.get<string>('USER');
    password: string = this.configService.get<string>('PASS');
    radarrFolder: string = this.configService.get<string>('RADARR_FOLDER');
    filesInDonwload: string[] = [];
    constructor(
        @InjectQueue('emulexRequest') private emulexRequestQueue: Queue,
        @InjectQueue('emulexSearch') private emulexSearchQueue: Queue,
        @InjectQueue('emuleSearchResult') private emulexSearchResultQueue: Queue,

        private readonly httpService: HttpService,
        private redisCacheService: RedisCacheService,
        private configService: ConfigService
    ) { }



    onModuleInit() {
        return null;
    }
    async processRequestQueue(dataObject: JobData, priority: number) {
        const job = await this.emulexRequestQueue.add(dataObject.jobType,
            dataObject,
            {
                delay: 3000,
                removeOnFail: true,
                removeOnComplete: false,
                priority: priority

            }, // 2 seconds delayed
        );
        const data = await job.finished();

        return data;
    }
    async processSearchQueue(dataObject: JobData, priority: number) {
        const job = await this.emulexSearchQueue.add("search",
            dataObject,
            {
                delay: 1000,
                removeOnFail: true,
                removeOnComplete: false,
                priority: priority,

            }, // 2 seconds delayed
        );
        const data = await job.finished();

        return data;
    }
    checkLoginPage(data: any): Promise<boolean> {
        return null;
    }
    validation(data: string, urlParameters: any): Promise<string> {
        return null;
    }
    storeRedisIdEmule() {
        return null;
    }
    getIdEmule() {
        return null;
    }
    async makeSearch(keyword: string) {
        const urlParameters = {
            'custom': 'Complex Search',
            'keywords': keyword,
            'minsize': '',
            'minsize_unit': '1048576',
            'maxsize': '',
            'maxsize_unit': '1048576',
            'media': '',
            'media_propose': '',
            'format': 'mkv',
            'format_propose': '',
            'artist': '',
            'album': '',
            'title': '',
            'bitrate': '',
            'network': 'Donkey'
        };
        let html: string;
        html = await this.makeRequest(urlParameters, '/submit');

        let data: string = html;

        //data = await this.validation(html, urlParameters);

        return data;
    }
    async getSearchResults() {
        const urlParameters = {
            'q': 'vr'
        };
        let html: string;
        html = await this.makeRequest(urlParameters, '/submit');

        let data: string = html;

        const node = parse(data);
        let $ = cheerio.load(data);

        let files = [];

        //const nodes = $("form[method='GET'] table:has(a:contains('Search'))");
        $("table#resultsTable  tbody > tr[class^='dl-']").each((i, el) => {
            const edk2linkClean = ($("td.sr", el).find("a").attr('href'));
            const seed = $("td:nth-of-type(4)", el).text();
            const peer = $("td:nth-of-type(5)", el).text();

            const fileNames = ($("a[target='fstatus']", el).html()).split('<br>');

            let ed2kInfo = edk2linkClean.split('<br>');

            let ed2kLink = edk2linkClean.split('|');

            for (let index = 0; index < fileNames.length; index++) {
                const fileNmaeClean = fileNames[index].trimStart().replace('/n', '');
                const fileNameEncoded = encodeURIComponent(fileNmaeClean);
                const ed2k = [
                    'ed2k://',
                    'file',
                    fileNameEncoded,
                    ed2kLink[3],
                    ed2kLink[4],
                    '/'
                ];
                const ed2kUrl = ed2k.join('|');
                const ed2kSearch = new Ed2kSearch(fileNmaeClean, ed2kLink[4], ed2kLink[3], ed2kUrl, peer, seed);
                files.push(ed2kSearch);
            }


            /*const fileName = ed2kInfo[2];

            ed2kInfo[2] = ed2kInfo[2].replaceAll(' ', "%20");
            const urled2k = ed2kInfo.join('|');

            const peersSeeds = (($(el.children[7]).text()).replace([')'], '')).split('(');

            
            */
        });

        return files;
    }
    async getDownloads() {
        let urlParameters = {
            'q': 'vd',
        };
        let html: string;
        html = await this.makeRequest(urlParameters, '/submit');
        let data: string = html;

        const node = parse(data);
        let $ = cheerio.load(data);

        let files = [];

        //Gets the downloads table
        const nodes = $("table.downloaders");

        let donwloadsItems = [];

        $("tr[class^='dl-']", nodes).each(async (i, el) => {
            const donwloadId = $(el).find("input").attr('value');
            const donwloadRate = $('td:nth-child(16)', el).text();

            donwloadsItems.push({ id: donwloadId, rate: donwloadRate });
        });

        for (let index = 0; index < donwloadsItems.length; index++) {
            const element = donwloadsItems[index];

            const donwloadId = element.id;
            const donwloadRate = element.rate;

            let downloadStatus = "Downloading"
            if (donwloadRate === "Paused") {
                downloadStatus = "Paused"
            }


            let urlParameters = {
                'q': 'vd ' + donwloadId,
            };
            let html: string;
            html = await this.makeRequest(urlParameters, '/submit');
            let data: string = html;

            const node = parse(data);
            let $ = cheerio.load(data);

            const nameFile = $("input[name='newName']").attr('value');

            const ed2k = $("table#sourcesInfo td.sr a[href^='ed2k']").attr('href')
            const sizeInfo = $("table#sourcesInfo tr:nth-child(3) td[class='sr']").text();

            const sizeDownloaded = sizeInfo.split("bytes")[0];
            const sizeComplete = sizeInfo.split("bytes")[1].replace("of", "");

            const ed2kSplit = ed2k.split("|");


            const ed2kFile = new Ed2kfile(nameFile, ed2kSplit[4], sizeComplete, downloadStatus, donwloadRate ?? '0', sizeDownloaded, this.radarrFolder)
            files.push(ed2kFile);
        }

        //Get complete downloads in radarr folder
        let urlParameters3 = {
            'q': 'upstats',
        };
        html = await this.makeRequest(urlParameters3, '/submit');
        data = html;

        let $2 = cheerio.load(data);
        $2("tr[class^=dl]:has(a[href='submit?q=debug_dir+incoming/files/radarr23123']) td > a[href^='ed2']").each(async (i, el) => {
            const ed2k = $2(el).attr('href')
            const ed2kSplit = ed2k.split("|");
            const nameFile = decodeURIComponent(ed2kSplit[2]).replace('\n', '');


            console.log(nameFile);

            const ed2kFile = new Ed2kfile(nameFile, ed2kSplit[4], ed2kSplit[3], "Completed", '0', ed2kSplit[3], this.radarrFolder)

            let filesInFolder = fs.readdirSync(this.radarrFolder, { withFileTypes: true });

            if (filesInFolder.some(e => e.name === ed2kFile.$fileName)) {
                files.push(ed2kFile);
            }
            else {
                //Solo dios puede juzgarm por esto
                for (let index = 0; index < filesInFolder.length; index++) {
                    const file = filesInFolder[index];
                    const fullpath = path.join(this.radarrFolder, file.name);
                    if (fs.statSync(fullpath).size == ed2kSplit[3]) {
                        fs.renameSync(fullpath, path.join(this.radarrFolder, nameFile));
                        files.push(ed2kFile);
                    }

                }
            }
        });

        return files;
    }
    async startDownload(keyword: string) {
        const urlParameters = {
            'q': 'dllink ' + keyword

        };
        let html: string;
        html = await this.makeRequest(urlParameters, '/submit');

        let data: string = html;

        await this.redisCacheService.cleanValue('/emulex/downloads');


        return data;
    }
    getSharedFiles() {
        return null;
    }
    async removeDownload(keyword: string) {
        let urlParameters = {
            'q': 'vd',
        };
        let html: string;
        html = await this.makeRequest(urlParameters, '/submit');
        let data: string = html;

        const node = parse(data);
        let $ = cheerio.load(data);

        let files = [];

        //Gets the downloads table
        const nodes = $("table.downloaders");

        let donwloadsItems = [];

        $("tr[class^='dl-']", nodes).each(async (i, el) => {
            const donwloadId = $(el).find("input").attr('value');
            const donwloadRate = $('td:nth-child(16)', el).text();

            donwloadsItems.push({ id: donwloadId, rate: donwloadRate });
        });

        for (let index = 0; index < donwloadsItems.length; index++) {
            const element = donwloadsItems[index];

            const donwloadId = element.id;
            const donwloadRate = element.rate;

            let downloadStatus = "Downloading"
            if (donwloadRate === "Paused") {
                downloadStatus = "Paused"
            }


            let urlParameters = {
                'q': 'vd ' + donwloadId,
            };
            let html: string;
            html = await this.makeRequest(urlParameters, '/submit');
            let data: string = html;

            const node = parse(data);
            let $ = cheerio.load(data);

            const nameFile = $("input[name='newName']").attr('value');

            const ed2k = $("table#sourcesInfo td.sr a[href^='ed2k']").attr('href');

            if (ed2k.includes(keyword)) {
                let urlParameters = {
                    'cancel': donwloadId
                };
                let html: string;
                html = await this.makeRequest(urlParameters, '/files');
                let data: string = html;
                await this.redisCacheService.cleanValue('/emulex/downloads');
                return 200;
            }

        }

        let urlParameters3 = {
            'q': 'upstats',
        };
        html = await this.makeRequest(urlParameters3, '/submit');
        data = html;

        let $2 = cheerio.load(data);
        $2("tr[class^=dl]:has(a[href='submit?q=debug_dir+incoming/files/radarr23123']) td > a[href^='ed2']").each(async (i, el) => {
            const ed2k = $2(el).attr('href')
            const ed2kSplit = ed2k.split("|");
            const nameFile = decodeURIComponent(ed2kSplit[2]);


            console.log(nameFile);
            const ed2kFile = new Ed2kfile(nameFile, ed2kSplit[4], ed2kSplit[3], "Completed", '0', ed2kSplit[3], this.radarrFolder)

            if (ed2kSplit[4] == keyword) {

                let filesInFolder = fs.readdirSync(this.radarrFolder, { withFileTypes: true });
                //let filesInFolder = await fsp.readdir(this.radarrFolder);
                if (filesInFolder.includes(ed2kFile.$fileName)) {
                    //await fsp.unlink(path.join(this.radarrFolder, ed2kFile.$fileName));
                    return;
                }

            }

        });


    }
    async getStatus() {
        const urlParameters = {
            'q': 'id'
        };
        let html: string;

        html = await this.makeRequest(urlParameters, '/submit');

        let data: string = html;
        let $ = cheerio.load(data);

        let files = [];

        const nodes = $("pre");
        const cadena = (nodes.html().replace(/(\r\n|\n|\r)/gm, "")).replace('\t', " ");

        const isEd2kConected: boolean = cadena.includes("(HighID)");
        //const isKadConected: boolean = cadena.includes("Kad NetworkStatus:\tOpen");

        const status: boolean = isEd2kConected;

        return status ? 200 : 503;
    }
    async makeRequest(parameters: any, path: string) {
        try {
            const config = this.configGenerator(parameters);
            console.log(`Start HTTP request with parameter: ${JSON.stringify(parameters)}`);
            const { data } = await firstValueFrom(
                this.httpService.get<any>(this.baseUrl + path, {
                    params: config.urlParam,
                    headers: config.headers
                }
                ).pipe(
                    catchError((error: AxiosError) => {
                        console.log(error);
                        throw 'Error in login request'
                    })
                )
            );

            return data;
        } catch (error) {
            console.log(error);
            throw Error(error);
        }
    }
    configGenerator(urlParameters: string[][]) {

        const user: string = 'radarr';
        const pass: string = 'df9856wd';

        let config = {
            urlParam: new URLSearchParams(urlParameters),
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Authorization': 'Basic ' + btoa(`${user}:${pass}`),
                'Connection': 'keep-alive',
                'Referer': 'http://192.168.1.174:4086/submit?custom=Complex+Search',
                'Upgrade-Insecure-Requests': '1'
            }
        }

        return config;
    }

}