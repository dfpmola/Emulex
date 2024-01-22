import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { HttpCode, Injectable, OnModuleInit } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Queue } from 'bull';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { JobData } from './entity/JobData.class';
const xpath = require('xpath');
const parse5 = require('parse5');
const xmlser = require('xmlserializer');
const dom = require('xmldom').DOMParser;
@Injectable()
export class EmuleService implements OnModuleInit {
    emuleRequest: Queue;
    baseUrl: string = 'http://192.168.1.100:4711';
    password: string = 'df985';
    constructor(
        @InjectQueue('emuleRequest') private emuleRequestQueue: Queue,
        @InjectQueue('emuleSearch') private emuleSearchQueue: Queue,

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
                delay: 2000,
                attempts: 0,
                removeOnFail: true
            }, // 2 seconds delayed
        );
        const data = await job.finished();
        console.log(job, data);

        return this.checkLoginPage(data, dataObject);
    }
    async processSearchQueue(dataObject: JobData) {
        const job = await this.emuleSearchQueue.add(
            dataObject,
            {
                delay: 2000, attempts: 0,
                removeOnFail: true
            }, // 2 seconds delayed
        );
        const data = await job.finished();
        console.log(job, data);
        return this.checkLoginPage(data, dataObject);

    }

    async checkLoginPage(data, dataObject: JobData) {
        if (data.indexOf('.failed') >= 0) {
            console.log("SES failed");
            this.storeRedisIdEmule();
            return this.processRequestQueue(dataObject);
        };
        return data;
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
        console.log(html);

        const document = parse5.parse(html.toString());
        const xhtml = xmlser.serializeToString(document);
        const doc = new dom().parseFromString(xhtml);
        const select = xpath.useNamespaces({ "x": "http://www.w3.org/1999/xhtml" });
        const nodes = select("//x:a[contains(text(),'My Info')]/@href", doc);
        console.log(nodes);
        const href = nodes[0].value;
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
        console.log(html);
        return html;
    }
    async getSearchResults(html: string) {


    }
    async makeRequest(parameters) {
        const config = this.configGenerator(parameters);
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
