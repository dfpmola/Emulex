import { Ed2k } from "./Ed2k.class";

export enum Status {
    downloading = 'downloading',
    waiting = 'Waiting',
    stoped = 'Stopped',
    paused = 'Paused',
    moving = 'moving',
    hashing = 'hashing',
    complete = 'Completed'
}

export class Ed2kfile extends Ed2k {
    private _eta: number;
    private _status: Status;
    private _speed: number;
    private _downloadedSize: number;
    private _path: string

    constructor($fileName: string, $hash: string, $size: string, $status: string, $speed: string, $downloadedSize: string, $path: string) {
        super($fileName, $hash, 0);

        this._size = this.convertoBytes($size);
        this._speed = this.convertoBytesSpeed($speed);
        this._downloadedSize = this.convertoBytes($downloadedSize);
        this._status = this.getStatus($status);
        this._eta = $speed ? this.calculateEta(this._size, this._downloadedSize, this._speed) : 0;
        this._path = $path


    }

    private calculateEta(size: number, downloadedSize: number, speed: number): number {
        const restSize: number = size - downloadedSize;
        const eta = restSize / speed;
        return eta;
    }
    private getStatus($status: string): Status {


        let title = $status;
        if ($status.includes('sources)')) {
            title = ($status.split('(from'))[0];
        }

        switch (title.replaceAll(" ", "")) {
            case "Downloading":
                return Status.downloading;
            case "Waiting":
                return Status.waiting;
            case "Completed":
                return Status.complete;
            case "Hashing":
                return Status.hashing;
            case "Moving":
                return Status.moving;
            default:
                break;
        }
    }





}