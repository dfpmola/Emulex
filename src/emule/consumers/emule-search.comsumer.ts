import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { JobData } from "../entity/JobData.class";

@Processor('emuleSearch')
export class EmuleSearchConsumer {
    constructor(
        @InjectQueue('emuleRequest') private emuleRequestQueue: Queue,
    ) { }
    @Process()
    async searchEmule(job: Job<JobData>) {
        console.log(job.data);


        //TODO check if is other search is in queue, if is wait until finish search and retrive results.
        const jobList = await this.emuleRequestQueue.getJobs(['waiting', 'active']);
        if (jobList.length != 0) {

        }
        console.log(jobList);
        const jobRequest = await this.emuleRequestQueue.add(job.data, {
            delay: 2000, attempts: 0,
            removeOnFail: true
        });
        const data = await jobRequest.finished();
        return data;
    }
}