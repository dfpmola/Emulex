import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Queue } from 'bull';
import { catchError, firstValueFrom } from 'rxjs';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { JobData } from './entity/JobData.class';
import { parse } from 'node-html-parser';
import { Ed2kfile } from './entity/Ed2kfile.class';
import { Ed2kSearch } from './entity/Ed2kSearch.class';
import { ConfigService } from '@nestjs/config';
import { EmulexServiceInterface } from '../emulex/emulex.service.interface';
const chokidar = require('chokidar');
const fs = require('fs');
const fsp = fs.promises;
const cheerio = require('cheerio');

@Injectable()
export class EmuleService implements OnModuleInit, EmulexServiceInterface {
    emuleRequest: Queue;
    baseUrl: string = this.configService.get<string>('EMULE_URL_PORT');
    password: string = this.configService.get<string>('PASSWORD');
    radarrFolder: string = this.configService.get<string>('RADARR_FOLDER');
    filesInDonwload: string[] = [];
    constructor(
        @InjectQueue('emuleRequest') private emuleRequestQueue: Queue,
        @InjectQueue('emuleSearch') private emuleSearchQueue: Queue,
        @InjectQueue('emuleSearchResult') private emuleSearchResultQueue: Queue,

        private readonly httpService: HttpService,
        private redisCacheService: RedisCacheService,
        private configService: ConfigService
    ) {



    }
    async onModuleInit() {
        await this.emuleRequestQueue.obliterate({ force: true });
        await this.emuleSearchQueue.obliterate({ force: true });

        const watcher = chokidar.watch(this.radarrFolder, {
            persistent: true
        });

        // Something to use when events are received.
        const log = console.log.bind(console);
        // Add event listeners.
        watcher
            .on('add', path => log(`File ${path} has been added`))
            .on('change', path => log(`File ${path} has been changed`))
            .on('unlink', path => log(`File ${path} has been removed`));

    }



    async processRequestQueue(dataObject: JobData, priority: number) {
        const job = await this.emuleRequestQueue.add(dataObject.jobType,
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
        const job = await this.emuleSearchQueue.add("search",
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

    async checkLoginPage(data): Promise<boolean> {
        if (typeof data === 'string' && data.indexOf('.failed') >= 0) {
            console.log("SES failed");
            await this.storeRedisIdEmule();
            return true;
        };
        return false;
    }
    async validation(data: string, urlParameters): Promise<string> {
        let result: string = data;
        if (await this.checkLoginPage(result)) {
            urlParameters.ses = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
            result = await this.makeRequest(urlParameters);
            if (await this.checkLoginPage(result)) {
                throw Error("Error in login, check emule");
            }
        }
        return result;
    }
    async storeRedisIdEmule() {
        let value;
        try {
            value = await this.getIdEmule();
        } catch (error) {
            return error;
        }
        await this.redisCacheService.storeValue("emuleId", { ses: value });
        const idStoredValue = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
        console.log(idStoredValue);
    }
    async getIdEmule(): Promise<string> {
        const urlParameters = {
            'p': this.password,
            'w': 'password'
        };
        const html = await this.makeRequest(urlParameters);

        let $ = cheerio.load(html);

        let products = [];

        const node = $("a:contains('My Info')").attr('href')

        const href = node;
        const cadena = href;
        const regex = /ses=(.*?)&/;
        const resultado = regex.exec(cadena);
        if (resultado) {
            const contenido = resultado[1];
            console.log(contenido);
            return contenido;
        } else {
            console.log("No se encontró ninguna coincidencia.");
            return Error("NO ses found");
        }



    }
    async makeSearch(keyword: string): Promise<string> {
        const ses = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
        const urlParameters = {
            'tosearch': keyword,
            'type': 'Video',
            'min': '',
            'max': '',
            'avail': '',
            'ext': '',
            'method': 'global',
            'ses': ses,
            'w': 'search'

        };
        let html: string;
        html = await this.makeRequest(urlParameters);

        let data: string = html;

        data = await this.validation(html, urlParameters);

        return data;
    }
    async getSearchResults(): Promise<Ed2kSearch[]> {

        try {


            const ses = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
            const urlParameters = {
                'ses': ses,
                'w': 'search'
            };
            let html: string;
            html = await this.makeRequest(urlParameters);

            let data: string = html;
            data = await this.validation(html, urlParameters);


            const node = parse(data);
            let $ = cheerio.load(data);

            let files = [];

            const nodes = $("form[method='GET'] table:has(a:contains('Search'))");
            $("tr", nodes).each((i, el) => {
                if (el.children.length == 11 && typeof ($(el).find("a").attr('onmouseover')) !== 'undefined') {
                    const edk2linkClean = ($(el).find("a").attr('onmouseover').replace("searchmenu(event,'", '').replace("')", ''));

                    let ed2kInfo = edk2linkClean.split("|");

                    const fileName = ed2kInfo[2];

                    ed2kInfo[2] = ed2kInfo[2].replaceAll(' ', "%20");
                    const urled2k = ed2kInfo.join('|');

                    const peersSeeds = (($(el.children[7]).text()).replace([')'], '')).split('(');

                    const ed2kSearch = new Ed2kSearch(fileName, ed2kInfo[4], ed2kInfo[3], urled2k, parseInt(peersSeeds[0]), parseInt(peersSeeds[1]));
                    files.push(ed2kSearch);
                }

            });

            return files;

        }
        catch (Error) {
            console.log(Error);
            throw Error;
        }
    }

    async getDownloads(): Promise<Ed2kfile[]> {

        const ses = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
        const urlParameters = {
            'ses': ses,
            'w': 'transfer',
            'cat': '1'
        };
        let html: string;
        html = await this.makeRequest(urlParameters);

        let data: string = html;
        data = await this.validation(html, urlParameters);


        const node = parse(data);
        let $ = cheerio.load(data);

        let files = [];

        //Gets the downloads table
        const nodes = $("table[bgcolor='#99CCFF']:not(.percent_table)");

        $("tr", nodes).each((i, el) => {
            if (el.children.length == 19 && $(el).find("a").attr('onmouseout') == 'delayhidemenu()') {

                //PopUp where the information is displayed
                const donwloadsPopup = $(el).find("a").attr('onmouseover').split(",")
                const infoDownload = donwloadsPopup[2].split("\\n");

                //Speed in kilobytes
                const downloadSpeed = $(el).children("td").get().map((img) => {
                    if ($(img).attr('valign') == 'top' && $(img).attr('nowrap') == "" && $(img).attr('class') == 'down-line-downloading-right') {
                        console.log("text: " + $(img).text());
                        return $(img).text();
                    }
                }).filter(notUndefined => notUndefined !== undefined);;


                //Format the text by jumplines and avoid empty entry
                const result = (donwloadsPopup[2].split("\\n").filter((elemnt) => elemnt.length > 0));
                let dataFile = {
                    fileName: result[0].replace("'", "")
                };

                //Transform each entry
                for (let index = 1; index < result.length; index++) {
                    const entry = result[index].split(":");
                    dataFile[entry[0]] = entry[1];
                }

                const hash: string = dataFile['Hash'] ?? dataFile['eD2K Hash'];


                let size: string = "0";
                if (infoDownload[6].includes('Size') || infoDownload[6].includes('Completed')) {
                    size = infoDownload[6].split(':')[1]
                }
                else if (infoDownload[2].includes('Size on disk')) {
                    size = infoDownload[2].split(":")[1].split('(')[0]
                }
                else {
                    size = infoDownload[3].split(':')[1]
                }
                const sizeClean: string[] = (size.split('('))[0].split('/');
                const totalSize: string = sizeClean[1] ?? sizeClean[0];
                const downloadedSize: string = sizeClean[0];

                const ed2kFile = new Ed2kfile(dataFile.fileName, hash, totalSize, dataFile['Status'] ?? "Completed", downloadSpeed[2] ?? '0', downloadedSize, this.radarrFolder)

                files.push(ed2kFile);
            }

        });
        files.forEach(async file => {
            await this.redisCacheService.storeValue(file.$fileName, file);
        });

        /*
               let sharedFiles = await this.getSharedFiles();
       
              
               fs.readdir(this.radarrFolder, (err, files) => {
                   sharedFiles = sharedFiles.filter((elemnt: Ed2kfile) => {
                       files.forEach(__filename => {
                           if (elemnt.$fileName == __filename) {
                               return elemnt;
                           }
                       });
       
                   });
               });
                       
       
               let result = []
               let filesInFolder = await fsp.readdir(this.radarrFolder);
               for (const sharedFile of sharedFiles) {
                   if (filesInFolder.includes(sharedFile._fileName)) {
                       result.push(sharedFile);
                   }
               }
       
               let resultEd2k = files.filter(o1 => result.some((o2) => {
                   o1._hash == o2._hash
               }))
       
       
       
               const resultDonwload = files.concat(result);
       */
        return files;
    }

    async startDownload(keyword: string): Promise<string> {


        const ses = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
        const urlParameters = {
            'ses': ses,
            'w': 'transfer',
            'ed2k': keyword,
            'cat': 1

        };
        let html: string;
        html = await this.makeRequest(urlParameters);

        let data: string = html;

        data = await this.validation(html, urlParameters);

        await this.redisCacheService.cleanValue('/emule/downloads');
        return data;
    }

    async getSharedFiles(): Promise<[Ed2kfile]> {


        const ses = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
        const urlParameters = {
            'ses': ses,
            'w': 'shared',
        };
        let html: string;
        html = await this.makeRequest(urlParameters);

        let data: string = html;

        data = await this.validation(html, urlParameters);

        const node = parse(data);
        let $ = cheerio.load(data);

        let files = [];

        /*
        $("acronym").each((i, el) => {
            const infoFileDonwload = $(el).attr('title').replace('\r').split('Hash:');
            files.push(infoFileDonwload);


        });

        */

        const nodes = $("table.shared-line-file-left");
        $("tr", nodes).each((i, el) => {
            if (($(el).find("a").attr('onmouseover')) !== 'undefined') {
                const edk2linkClean = ($(el).find("a").attr('onmouseover').replace("sharedmenu(event,'", '').replace("')", ''));

                let ed2kInfo = edk2linkClean.split("|");

                const fileName = ed2kInfo[2].replaceAll("%20", " ");

                ed2kInfo[2] = ed2kInfo[2].replaceAll(' ', "%20");
                const urled2k = ed2kInfo.join('|');

                const peersSeeds = (($(el.children[7]).text()).replace([')'], '')).split('(');

                //const ed2kSearch = new Ed2kSearch(fileName, ed2kInfo[4], ed2kInfo[3], urled2k, parseInt(peersSeeds[0]), parseInt(peersSeeds[1]));
                const ed2kFile = new Ed2kfile(fileName, ed2kInfo[4], ed2kInfo[3], "Completed", '0', ed2kInfo[3], this.radarrFolder)


                files.push(ed2kFile);
            }

        });

        return files;

    }

    async removeDownload(keyword: string): Promise<void> {
        const ses = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
        const urlParameters = {
            'ses': ses,
            'w': 'transfer',
            'ed2k': keyword,
            'cat': 1
        };
        let html: string;
        html = await this.makeRequest(urlParameters);

        let data: string = html;

        data = await this.validation(html, urlParameters);
    }

    async getStatus(): Promise<number> {

        const ses = (await this.redisCacheService.retriveValue("emuleId"))['ses'];
        const urlParameters = {
            'ses': ses,
            'w': 'myinfo'
        };
        let html: string;

        html = await this.makeRequest(urlParameters);

        let data: string = html;
        data = await this.validation(html, urlParameters);

        let $ = cheerio.load(data);

        let files = [];

        const nodes = $("pre");
        const cadena = (nodes.html().replace(/(\r\n|\n|\r)/gm, "")).replace('\t', " ");

        const isEd2kConected: boolean = cadena.includes("eD2K NetworkStatus: Connected");
        const isKadConected: boolean = cadena.includes("Kad NetworkStatus:\tOpen");

        const status: boolean = isEd2kConected && isKadConected;

        return status ? 200 : 503;


    }
    async makeRequest(parameters): Promise<string> {
        try {
            const config = this.configGenerator(parameters);
            console.log(`Start HTTP request with parameter: ${JSON.stringify(parameters)}`);
            const { data } = await firstValueFrom(
                this.httpService.post<any>(this.baseUrl + '/',
                    config.urlParam, {
                    headers: config.headers,
                    timeout: 190000
                }).pipe(
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
    configGenerator(urlParameters: string[][]): { urlParam: URLSearchParams; headers: object; } {

        let config = {
            urlParam: new URLSearchParams(urlParameters),
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Origin': this.baseUrl,
                'Connection': 'keep-alive',
                'Referer': this.baseUrl,
                'Upgrade-Insecure-Requests': '1'
            }
        }
        if (urlParameters['w'] == 'search') {
            delete config.headers.Origin
            config.headers.Referer = config.headers.Referer + `/?ses=${urlParameters['ses']}&w=search`
        }
        return config;


    }
}
