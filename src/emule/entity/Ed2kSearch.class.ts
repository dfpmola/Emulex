import { Ed2k } from "./Ed2k.class";

export class Ed2kSearch extends Ed2k {

    private _ed2kLinks: string;
    private _peers: number;
    private _seed: number;


    constructor($fileName: string, $hash: string, $size: string, $ed2Links: string, $peers: number, $seed: number) {
        super($fileName, $hash, parseFloat($size));
        this._ed2kLinks = $ed2Links;
        this._peers = $peers;
        this._seed = $seed;

    }



}