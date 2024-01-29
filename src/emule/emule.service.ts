import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { HttpCode, Injectable, OnModuleInit } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Queue } from 'bull';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { JobData } from './entity/JobData.class';
import { parse } from 'node-html-parser';
const cheerio = require('cheerio');
@Injectable()
export class EmuleService implements OnModuleInit {
    emuleRequest: Queue;
    baseUrl: string = 'http://192.168.1.100:4711';
    password: string = 'df985';
    constructor(
        @InjectQueue('emuleRequest') private emuleRequestQueue: Queue,
        @InjectQueue('emuleSearch') private emuleSearchQueue: Queue,
        @InjectQueue('emuleSearchResult') private emuleSearchResultQueue: Queue,


        private readonly httpService: HttpService,
        private redisCacheService: RedisCacheService
    ) { }
    async onModuleInit() {
        await this.emuleRequestQueue.obliterate({ force: true });
        await this.emuleSearchQueue.obliterate({ force: true });
    }



    async processRequestQueue(dataObject: JobData, priority: number) {
        const job = await this.emuleRequestQueue.add(dataObject.jobType,
            dataObject,
            {
                delay: 1000,
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

    async checkLoginPage(data) {
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
            urlParameters.ses = await this.redisCacheService.retriveValue();
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
        await this.redisCacheService.storeValue(value);
        const idStoredValue = await this.redisCacheService.retriveValue();
        console.log(idStoredValue);
    }
    async getIdEmule() {
        const urlParameters = {
            'p': 'df985',
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
    async makeSearch(keyword: string) {
        const ses = await this.redisCacheService.retriveValue();
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
    async getSearchResults() {

        const ses = await this.redisCacheService.retriveValue();
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
                files.push({
                    urled2k: urled2k,
                    hash: ed2kInfo[4],
                    nameFile: fileName,
                    size: ed2kInfo[3],
                    peers: peersSeeds[0],
                    seeds: peersSeeds[1],
                });
            }

        });

        return files;


    }
    async getStatus() {

        const ses = await this.redisCacheService.retriveValue();
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
    async makeRequest(parameters) {
        try {
            const config = this.configGenerator(parameters);
            console.log(`Start HTTP request with parameter: ${JSON.stringify(parameters)}`);
            const { data } = await firstValueFrom(
                this.httpService.post<any>(this.baseUrl + '/',
                    config.urlParam, {
                    headers: config.headers
                }).pipe(
                    catchError((error: AxiosError) => {
                        console.log(error.response.data);
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

        let config = {
            urlParam: new URLSearchParams(urlParameters),
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Origin': 'http://192.168.1.100:4711',
                'Connection': 'keep-alive',
                'Referer': 'http://192.168.1.100:4711',
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
