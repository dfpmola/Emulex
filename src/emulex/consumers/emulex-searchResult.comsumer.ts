import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { JobData } from "../entity/JobData.class";
import { EmuleService } from "../../emule/emule.service";
import { Inject } from "@nestjs/common";
import { EmulexServiceInterface } from "../emulex.service.interface";

@Processor('emuleSearchResult')
export class EmulexSearchResultConsumer {
    constructor(
        @Inject('EmulexServiceInterface') private emulexService: EmulexServiceInterface,

        @InjectQueue('emulexRequest') private emulexRequestQueue: Queue,
        @InjectQueue('emulexSearch') private emulexSearchQueue: Queue,
        @InjectQueue('emuleSearchResult') private emulexSearchResultQueue: Queue,

    ) { }
    @Process({ name: 'searchResult', concurrency: 1 })
    async searchResultchEmule(job: Job<JobData>) {

        const jobRequest = await this.emulexRequestQueue.add("searchResult", job.data, {
            delay: 1000,
            removeOnFail: true,
            removeOnComplete: false,
        });
        try {
            const JobSearch = await jobRequest.finished();
            return JobSearch;
        }
        catch (error) {
            console.log(Error);
            throw Error("Job emulexRequestQueue ended with error")
        }
    }

}