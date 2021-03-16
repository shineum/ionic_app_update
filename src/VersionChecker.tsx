import { HTTP } from '@ionic-native/http';
import { File } from '@ionic-native/file/ngx';
import { WebIntent } from '@ionic-native/web-intent/ngx';
  
export default class VersionChecker {
    file: File;
    fileDir: string;
    filePath: string;
    versionObj: {[key: string]: any};
    versionCheckUrl: string;
    downloadFileReady: boolean;
    downloadFilePath: string;
    downloadFileName: string;

    constructor(pVersionObj: {[key: string]: any}) {
        this.versionObj = pVersionObj;
        this.versionCheckUrl = pVersionObj.url;
        this.downloadFileReady = false;
        this.downloadFilePath = "";
        this.downloadFileName = "";
        this.file = new File();
        this.fileDir = this.file.externalCacheDirectory;
        this.filePath = "";
    }

    _resetDownloadData() {
        this.downloadFileReady = false;
        this.downloadFilePath = "";
        this.downloadFileName = "";
        this.filePath = "";
    }

    _getCompareArr(pVersionObj: {[key: string]: any}) {
        return pVersionObj.version.split(".").map( (e: string) => Number.parseInt(e) || 0 );
    }

    _getFilePath(pFileName: string) {
        return this.fileDir + pFileName;
    }

    _checkHasUpdate(pVersionObjToCheck: {[key: string]: any}) {
        let tCurrentAppVersionArr = this._getCompareArr(this.versionObj);
        let tRemoteAppVersionArr = this._getCompareArr(pVersionObjToCheck);
        for(let i = 0; i < tCurrentAppVersionArr.length; i++) {
            if (tCurrentAppVersionArr[i] < tRemoteAppVersionArr[i]) {
                return true;
            } else if (tCurrentAppVersionArr[i] == tRemoteAppVersionArr[i]) {
                continue;
            } else {
                break;
            }
        }        
        return false;
    }

    _checkHasFileAsync(pFileName: string) {
        return this.file.checkFile(this.fileDir, pFileName);
    }

    _deleteFileAsync(pFileName: string) {
        return this.file.removeFile(this.fileDir, pFileName);
    }

    _downloadFileAsync(pUrl: string, pFileName: string) {
        return HTTP.downloadFile(pUrl, null, {}, this._getFilePath(pFileName));
    }

    _runUpdate(pPath: string) {
        let webIntent = new WebIntent();
        const options = {
            action: webIntent.ACTION_VIEW,
            url: pPath,
            type: 'application/vnd.android.package-archive'
        };
        webIntent.startActivity(options).then(() => {}, (err) => {});
    }

    runUpdate() {
        this._runUpdate(this.filePath);
    }

    downloadFile() {
        return new Promise<void>((pfResolved, pfRejected) => {
            new Promise<void>((pfResolved, pfRejected) => { 
                if (this.downloadFileReady) {
                    pfResolved();
                } else {
                    let tmpArr = this.versionCheckUrl.split("/");
                    tmpArr.pop();
                    tmpArr.push(this.downloadFilePath);
                    tmpArr.push(this.downloadFileName);

                    let tBinaryUrl = tmpArr.join("/");
                    this._downloadFileAsync(tBinaryUrl, this.downloadFileName).then( pfResolved, pfRejected );
                }
            })
            .then( pfResolved, pfRejected );            
        });
    }

    checkUpdate() {
        this._resetDownloadData();
        return new Promise<boolean>((pfResolved, pfRejected) => {
            HTTP.sendRequest(this.versionCheckUrl, {method: "get", headers: {}})
            .then(res => JSON.parse(res.data))
            .then(pData => {
                let tPromises = [];
                tPromises.push( new Promise<boolean>( (pfResolved) => { pfResolved(this._checkHasUpdate(pData.app)); }) );
                tPromises.push(
                    new Promise<boolean>( (pfResolved) => {
                        this._checkHasFileAsync(pData.app.file).then( () => { pfResolved(true); }, () => { pfResolved(false); });
                    })
                );
                if (pData.app) {
                    this.downloadFilePath = pData.app.path;
                    this.downloadFileName = pData.app.file;
                    this.filePath = this._getFilePath(this.downloadFileName);
                }        
                return Promise.all(tPromises);
            })
            .then(pParams => {
                let tPromises = [];
                tPromises.push( new Promise<boolean>( (pfResolved) => { pfResolved(pParams[0]); }) );
                if (pParams[1]) {
                    this.downloadFileReady = true;
                    if (!pParams[0]) {
                        tPromises.push( new Promise<boolean>( (pfResolved) => {
                            this._deleteFileAsync(this.downloadFileName).then( () => { pfResolved(true);} );
                        }) );
                    }
                }
                return Promise.all(tPromises);
            })
            .then(pParams => pfResolved(pParams[0]))
            .catch(err => pfRejected(err));
        });
    }
}