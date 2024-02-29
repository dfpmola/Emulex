import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { JobData } from "../entity/JobData.class";
import { Inject } from "@nestjs/common";
import { EmulexServiceInterface } from "../emulex.service.interface";

@Processor('emulexRequest')
export class EmulexRequestConsumer {
    constructor(
        @Inject('EmulexServiceInterface') private emulexService: EmulexServiceInterface,
        @InjectQueue('emulexSearch') private emulexSearchQueue: Queue,
    ) { }

    @Process({ name: "search", concurrency: 1 })
    async syncsearchRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const data = await this.emulexService.makeSearch(jobData.keyword);
        return data;

    }
    @Process({ name: "searchResult", concurrency: 0 })
    async syncsearchResultRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const dataSearchResult = await this.emulexService.getSearchResults()
        return JSON.stringify(dataSearchResult);
    }

    @Process({ name: "checkStatus", concurrency: 0 })
    async syncCheckStatusRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const dataStatus = await this.emulexService.getStatus()
        return dataStatus;
    }

    @Process({ name: "downloads", concurrency: 0 })
    async syncDownloadsRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);
        const dataStatus = await this.emulexService.getDownloads()
        return JSON.stringify(dataStatus);
    }

    @Process({ name: "addDownloads", concurrency: 0 })
    async syncAddDownloadsRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);
        const dataStatus = await this.emulexService.startDownload(jobData.keyword);
        return JSON.stringify(dataStatus);
    }

    @Process({ name: "getSharedFiles", concurrency: 0 })
    async syncGetSharedFilesRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const dataStatus = await this.emulexService.getSharedFiles()
        return dataStatus;
    }

    @Process({ name: "removeDownload", concurrency: 0 })
    async syncRemoveDownloadRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const dataStatus = await this.emulexService.removeDownload(jobData.keyword)
        return dataStatus;
    }


}