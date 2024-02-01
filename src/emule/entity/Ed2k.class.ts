import { Hash } from "crypto";


export class Ed2k {

    protected _fileName: string;
    protected _hash: string;
    protected _size: number;

    constructor($fileName: string, $hash: string, $size: number) {
        this._fileName = $fileName;
        this._hash = $hash;
        this._size = $size;
    }

    /**
     * Getter $fileName
     * @return {string}
     */
    public get $fileName(): string {
        return this._fileName;
    }

    /**
     * Getter $hash
     * @return {string}
     */
    public get $hash(): string {
        return this._hash;
    }

    /**
     * Getter $size
     * @return {number}
     */
    public get $size(): number {
        return this._size;
    }

    /**
     * Setter $fileName
     * @param {string} value
     */
    public set $fileName(value: string) {
        this._fileName = value;
    }

    /**
     * Setter $hash
     * @param {string} value
     */
    public set $hash(value: string) {
        this._hash = value;
    }

    /**
     * Setter $size
     * @param {number} value
     */
    public set $size(value: number) {
        this._size = value;
    }


    protected convertoBytes(value: string): number {

        if (value.includes("GB")) {
            let cleanValue: number = parseFloat(value.replace("GB", ""));
            const sizeInBytes: number = cleanValue * 1000000000;
            return sizeInBytes;
        }
        else if (value.includes("MB")) {
            let cleanValue: number = parseFloat(value.replace("MB", ""));
            const sizeInBytes: number = cleanValue * 1000000;
            return sizeInBytes;
        }
        else {
            let cleanValue: number = parseFloat(value);
            const sizeInBytes: number = cleanValue * Math.pow(1024, 1);
            return sizeInBytes;
        }
    }

}