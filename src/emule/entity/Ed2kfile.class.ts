import { Ed2k } from "./Ed2k.class";

export enum Status {
    downloading,
    waiting,
    stoped,
    paused,
    moving,
    hashing,
    complete
}

export class Ed2kfile extends Ed2k {
    private _eta: number;
    private _status: Status;
    private _speed: number;
    private _downloadedSize: number;
    private _path: string

    constructor($fileName: string, $hash: string, $size: string, $status: Status, $speed: string, $downloadedSize: string, $path: string) {
        super($fileName, $hash, 0);

        this._size = this.convertoBytes($size);
        this._speed = this.convertoBytes($speed);
        this._downloadedSize = this.convertoBytes($downloadedSize);
        this._status = $status;
        this._eta = $speed ? this.calculateEta(this._size, this._downloadedSize, this._speed) : 0;
        this._path = $path


    }

    private calculateEta(size: number, downloadedSize: number, speed: number): number {
        const restSize: number = size - downloadedSize;
        const eta = restSize / speed;
        return eta;
    }
    private getStatus($status: string): Status {

        switch ($status.replaceAll(" ", "")) {
            case "downloading":
                return Status.downloading;
                break;
            case "waiting":
                return Status.waiting;
            case "hashing":
                return Status.hashing;
            case "moving":
                return Status.moving;
            default:
                break;
        }
    }





}