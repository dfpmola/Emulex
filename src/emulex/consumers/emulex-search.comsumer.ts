import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { JobData } from "../entity/JobData.class";
import { EmuleService } from "../../emule/emule.service";
import { Inject } from "@nestjs/common";
import { EmulexServiceInterface } from "../emulex.service.interface";

@Processor('emulexSearch')
export class EmulexSearchConsumer {
    constructor(
        @Inject('EmulexServiceInterface') private emulexService: EmulexServiceInterface,

        @InjectQueue('emulexRequest') private emulexRequestQueue: Queue,
        @InjectQueue('emulexSearch') private emulexSearchQueue: Queue,
        @InjectQueue('emuleSearchResult') private emulexSearchResultQueue: Queue,


    ) { }
    @Process({ name: "search", concurrency: 1 })
    async searchEmule(job: Job<JobData>) {
        //TODO check if is other search is in queue, if is wait until finish search and retrive results.

        const jobList = await this.emulexSearchQueue.getJobs(['waiting', 'active', 'delayed']);
        let result = jobList.find(obj => {
            return obj.name === "searchResult"
        })
        if (jobList.length != 0 && result) {
            await this.emulexSearchQueue.add(job, {
                delay: 5000,
                removeOnFail: true

            },)

        }


        const jobRequest = await this.emulexRequestQueue.add("search", job.data, {
            delay: 1000,
            removeOnFail: true,
            removeOnComplete: false,
        });
        const JobSearch = await jobRequest.finished();
        let JobSearchResult;

        if (jobRequest.data._jobType === 'search') {

            JobSearchResult = await this.emulexSearchResultQueue.add('searchResult', new JobData('searchResult', ''),
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