import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { EmuleService } from "../emule.service";
import { JobData } from "../entity/JobData.class";

@Processor('emuleRequest')
export class EmuleRequestConsumer {
    constructor(private emuleService: EmuleService) { }

    @Process()
    async syncRequestEmule(job: Job<JobData>) {
        console.log(job.data);
        const jobData = new JobData(job.data._jobType, job.data._keyword);

        const jobType = jobData.jobType;
        let data: any;
        switch (jobType) {
            case 'managment':
                //this.emuleService.makeRequest()
                break;
            case 'search':
                return await this.emuleService.makeSearch(jobData.keyword);
            case 'searchResult':
                //this.emuleService.makeRequest()
                break;
            default:
                break;
        }
    }

}