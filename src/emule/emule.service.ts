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



    async processRequestQueue(dataObject: JobData) {
        const job = await this.emuleRequestQueue.add(
            dataObject,
            {
                delay: 1000,
                removeOnFail: true,
                removeOnComplete: false,
            }, // 2 seconds delayed
        );
        const data = await job.finished();

        return this.checkLoginPage(data, dataObject);
    }
    async processSearchQueue(dataObject: JobData) {
        const job = await this.emuleSearchQueue.add("search",
            dataObject,
            {
                delay: 1000,
                removeOnFail: true,
                removeOnComplete: false,

            }, // 2 seconds delayed
        );
        const data = await job.finished();

        return this.checkLoginPage(data, dataObject);

    }

    async checkLoginPage(data, dataObject: JobData) {
        if (typeof data === 'string' && data.indexOf('.failed') >= 0) {
            console.log("SES failed");
            this.storeRedisIdEmule();
            return this.processRequestQueue(dataObject);
        };
        return data;
    }

    async checkLoginPageSearch(data) {
        if (typeof data === 'string' && data.indexOf('.failed') >= 0) {
            console.log("SES failed");
            this.storeRedisIdEmule();
            return true;
        };
        return false;
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

        /*
        const node = parse(html); 
        console.log(node.querySelector("a:contains('My Info')"));
        const nodesAttribute = node.querySelector("a:contains('My Info')").rawAttrs
        */
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
        let html;
        try {
            html = await this.makeRequest(urlParameters);
        } catch (error) {
            console.log(error);
            return html;
        }
        return html;
    }
    async getSearchResults() {

        const ses = await this.redisCacheService.retriveValue();
        const urlParameters = {
            'ses': ses,
            'w': 'search'
        };
        let html: string;
        try {
            html = await this.makeRequest(urlParameters);
        } catch (error) {
            console.log(error);
            throw Error(error);
        }

        const node = parse(html);
        let $ = cheerio.load(html);

        let files = [];

        const nodes = $("form[method='GET'] table:has(a:contains('Search'))");
        $("tr", nodes).each((i, el) => {
            if (el.children.length == 11 && typeof ($(el).find("a").attr('onmouseover')) !== 'undefined') {
                const ed2kInfo = ($(el).find("a").attr('onmouseover')).split("|");
                const peersSeeds = (($(el.children[7]).text()).replace([')'], '')).split('(')
                files.push({
                    hash: ed2kInfo[4],
                    nameFile: ed2kInfo[2],
                    size: ed2kInfo[3],
                    peers: peersSeeds[0],
                    seeds: peersSeeds[1],
                });
            }

        });

        return files;


    }
    async makeRequest(parameters) {
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
