import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { EmuleService } from "../emule.service";
import { JobData } from "../entity/JobData.class";

@Processor('emuleRequest')
export class EmuleRequestConsumer {
    constructor(
        private emuleService: EmuleService,
        @InjectQueue('emuleSearch') private emuleSearchQueue: Queue,
    ) { }

    @Process({ name: "search", concurrency: 1 })
    async syncsearchRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const data = await this.emuleService.makeSearch(jobData.keyword);
        return data;

    }
    @Process({ name: "searchResult", concurrency: 0 })
    async syncsearchResultRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const dataSearchResult = await this.emuleService.getSearchResults()
        return JSON.stringify(dataSearchResult);
    }

    @Process({ name: "checkStatus", concurrency: 0 })
    async syncCheckStatusRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const dataStatus = await this.emuleService.getStatus()
        return dataStatus;
    }

    @Process({ name: "downloads", concurrency: 0 })
    async syncDownloadsRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);
        const dataStatus = await this.emuleService.getDownloads()
        return JSON.stringify(dataStatus);
    }

    @Process({ name: "addDownloads", concurrency: 0 })
    async syncAddDownloadsRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);
        const dataStatus = await this.emuleService.startDownload(jobData.keyword);
        return JSON.stringify(dataStatus);
    }

    @Process({ name: "getSharedFiles", concurrency: 0 })
    async syncGetSharedFilesRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const dataStatus = await this.emuleService.getSharedFiles()
        return dataStatus;
    }


}