import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { JobData } from "../entity/JobData.class";
import { EmuleService } from "../emule.service";

@Processor('emuleSearchResult')
export class EmuleSearchResultConsumer {
    constructor(
        private emuleService: EmuleService,
        @InjectQueue('emuleRequest') private emuleRequestQueue: Queue,
        @InjectQueue('emuleSearch') private emuleSearchQueue: Queue,
        @InjectQueue('emuleSearchResult') private emuleSearchResultQueue: Queue,

    ) { }
    @Process()
    async searResultchEmule(job: Job<JobData>) {

        const jobRequest = await this.emuleRequestQueue.add("searchResult", job.data, {
            delay: 1000,
            removeOnFail: true,
        });

        try {
            const JobSearch = await jobRequest.finished();
            return JobSearch;
        }
        catch (error) {
            console.log(Error);
            throw Error("Job emuleRequestQueue ended with error")
        }



    }

}