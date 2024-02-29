import { JobData } from './entity/JobData.class';

export interface EmulexServiceInterface {
    processRequestQueue(dataObject: JobData, priority: number);
    processSearchQueue(dataObject: JobData, priority: number);
    checkLoginPage(data): Promise<boolean>;
    validation(data: string, urlParameters): Promise<string>;
    storeRedisIdEmule();
    getIdEmule();
    makeSearch(keyword: string);
    getSearchResults();
    getDownloads();
    startDownload(keyword: string);
    getSharedFiles();
    removeDownload(keyword: string);
    getStatus();
    makeRequest(parameters, path: string);
    configGenerator(urlParameters: string[][]);
}
