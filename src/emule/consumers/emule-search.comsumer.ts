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

    ) { }
    @Process()
    async searchEmule(job: Job<JobData>) {
        //TODO check if is other search is in queue, if is wait until finish search and retrive results.


        const jobList = await this.emuleSearchQueue.getJobs(['waiting', 'active', 'delayed']);
        let result = jobList.find(obj => {
            return obj.name === "searchResult"
        })
        if (jobList.length != 0 && result) {
            await this.emuleSearchQueue.add(job, {
                delay: 2000,
                removeOnFail: true

            },)

        }


        const jobRequest = await this.emuleRequestQueue.add("search", job.data, {
            delay: 2000,
            removeOnFail: true
        });
        const JobSearch = await jobRequest.finished();
        let JobSearchResult;

        if (await this.emuleService.checkLoginPageSearch(JobSearch)) {
            const jobRequest = await this.emuleRequestQueue.add("search", job.data, {
                delay: 2000, attempts: 1,
                removeOnFail: true
            });
            const JobSearch = await jobRequest.finished();
            if (await this.emuleService.checkLoginPageSearch(JobSearch)) {
                throw Error("Error in login, check emule");
            }
        }

        if (jobRequest.data._jobType === 'search') {

            JobSearchResult = await this.emuleSearchQueue.add('searchResult', new JobData('searchResult', ''),
                {
                    'delay': 8000,
                    'lifo': true,
                    removeOnFail: true,
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
    @Process({ name: 'searchResult' })
    async searchResultEmule(job: Job<JobData>) {
        const jobRequest = await this.emuleRequestQueue.add("searchResult", job.data, {
            delay: 2000,
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