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

    /*
    @Process()
    async syncRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        try {
            const jobType = jobData.jobType;
            switch (jobType) {
                case 'managment':
                    //this.emuleService.makeRequest()
                    break;
                case 'search':
                    const data = await this.emuleService.makeSearch(jobData.keyword);
                    return data;

                case 'searchResult':
                    const dataSearchResult = await this.emuleService.getSearchResults()
                    return "todo bien";
                default:
                    break;
            }
        } catch (error) {
            console.log(Error);
            throw Error("Job syncRequestEmule ended with error")

        }

    }
    */
    @Process({ name: "search", concurrency: 1 })
    async syncsearchRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const data = await this.emuleService.makeSearch(jobData.keyword);
        return data;

    }
    @Process({ name: "searchResult", concurrency: 1 })
    async syncsearchResultRequestEmule(job: Job<JobData>) {
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const dataSearchResult = await this.emuleService.getSearchResults()
        return JSON.stringify(dataSearchResult);
    }


}