import { Injectable, OnModuleInit } from '@nestjs/common';
import { JobData } from 'src/emule/entity/JobData.class';
import { EmulexServiceInterface } from 'src/emulex/emulex.service.interface';

@Injectable()
export class MldonkeyService implements OnModuleInit, EmulexServiceInterface {
    onModuleInit() {
        return null;
    }
    processRequestQueue(dataObject: JobData, priority: number) {
        return null;
    }
    processSearchQueue(dataObject: JobData, priority: number) {
        return null;
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
    makeSearch(keyword: string) {
        return null;
    }
    getSearchResults() {
        return null;
    }
    getDownloads() {
        return null;
    }
    startDownload(keyword: string) {
        return null;
    }
    getSharedFiles() {
        return null;
    }
    removeDownload(keyword: string) {
        return null;
    }
    getStatus() {
        return null;
    }
    makeRequest(parameters: any) {
        return null;
    }
    configGenerator(urlParameters: string[][]) {
        return null;
    }

}
