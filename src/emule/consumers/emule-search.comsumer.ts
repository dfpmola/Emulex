import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { JobData } from "../entity/JobData.class";
import { EmuleService } from "../emule.service";

@Processor('emuleSearch')
export class EmuleSearchConsumer {
    constructor(
        private emuleService: EmuleService,
        @InjectQueue('emuleRequest') private emuleRequestQueue: Queue,
        @InjectQueue('emuleSearch') private emuleSearchQueue: Queue,
        @InjectQueue('emuleSearchResult') private emuleSearchResultQueue: Queue,


    ) { }
    @Process({ name: "search", concurrency: 1 })
    async searchEmule(job: Job<JobData>) {
        //TODO check if is other search is in queue, if is wait until finish search and retrive results.

        const jobList = await this.emuleSearchQueue.getJobs(['waiting', 'active', 'delayed']);
        let result = jobList.find(obj => {
            return obj.name === "searchResult"
        })
        if (jobList.length != 0 && result) {
            await this.emuleSearchQueue.add(job, {
                delay: 1000,
                removeOnFail: true

            },)

        }


        const jobRequest = await this.emuleRequestQueue.add("search", job.data, {
            delay: 1000,
            removeOnFail: true,
            removeOnComplete: false,
        });
        const JobSearch = await jobRequest.finished();
        let JobSearchResult;

        if (jobRequest.data._jobType === 'search') {

            JobSearchResult = await this.emuleSearchResultQueue.add('searchResult', new JobData('searchResult', ''),
                {
                    'delay': 8000,
                    'lifo': true,
                    removeOnFail: true,
                    removeOnComplete: false,
                });


            try {
                const jobDataSearchResult = await JobSearchResult.finished();
                return jobDataSearchResult;
            } catch (error) {
                console.log(Error);
                throw Error("Job searchResult ended with error");
            }

        }


    }
}