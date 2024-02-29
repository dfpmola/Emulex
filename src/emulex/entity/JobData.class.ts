export class JobData {

    public _jobType: string;
    public _keyword: string;


    constructor(jobtype: string, keyword: string) {
        this._jobType = jobtype;
        this._keyword = keyword;

    }
    public get jobType(): string {
        return this._jobType;
    }
    public set jobType(value: string) {
        this._jobType = value;
    }
    public get keyword(): string {
        return this._keyword;
    }
    public set keyword(value: string) {
        this._keyword = value;
    }
}