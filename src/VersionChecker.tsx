import { HTTP } from '@ionic-native/http';
import { File } from '@ionic-native/file/ngx';
import { WebIntent } from '@ionic-native/web-intent/ngx';
  
export default class VersionChecker {
    file: File;
    fileDir: string;
    filePath: string;
    versionObj: {[key: string]: any};
    versionCheckUrl: string;

    constructor(pVersionObj: {[key: string]: any}) {
        this.versionObj = pVersionObj;
        this.versionCheckUrl = pVersionObj.url;
        this.file = new File();
        this.fileDir = this.file.externalCacheDirectory;
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

    checkUpdate() {
        return new Promise<boolean>((pfResolved, pfRejected) => {
            HTTP.sendRequest(this.versionCheckUrl, {method: "get", headers: {}})
            .then(res => JSON.parse(res.data))
            .then(pData => {
                alert(JSON.stringify(pData));
                let tPromises = [];
                tPromises.push( new Promise<any>( (pfResolved) => { pfResolved(pData); }) );
                tPromises.push( new Promise<boolean>( (pfResolved) => { pfResolved(this._checkHasUpdate(pData.app)); }) );
                tPromises.push(
                    new Promise<boolean>( (pfResolved) => {
                        this._checkHasFileAsync(pData.app.file).then( () => { pfResolved(true); }, () => { pfResolved(false); });
                    })
                );
                return Promise.all(tPromises);
            })
            .then(pParams => {
                let tPromises = [];
                tPromises.push( new Promise<any>( (pfResolved) => { pfResolved(pParams[0]); }) );
                tPromises.push( new Promise<boolean>( (pfResolved) => { pfResolved(pParams[1]); }) );

                let tData = pParams[0];
                let tFileName = tData.app.file;
                if (pParams[1] && !pParams[2]) {
                    tPromises.push( new Promise<void>( (pfResolved) => { 
                        let tPath = tData.app.path;
                        let tmpArr = this.versionCheckUrl.split("/");
                        tmpArr.pop();
                        tmpArr.push(tPath);
                        tmpArr.push(tFileName);

                        let tBinaryUrl = tmpArr.join("/");
                        this._downloadFileAsync(tBinaryUrl, tFileName).then( () => { pfResolved(); });
                    }) );
                } else if (!pParams[1] && pParams[2]) {
                    tPromises.push( new Promise<void>( (pfResolved) => {
                        this._deleteFileAsync(tFileName).then( () => { pfResolved();} );
                    }) );
                }
                return Promise.all(tPromises);
            })
            .then(pParams => {
                if (pParams[1]) {
                    let tData = pParams[0];
                    this.filePath = this._getFilePath(tData.app.file);
                    pfResolved(true);
                } else {
                    pfResolved(false);
                }
            })
            .catch((err) => {
                pfRejected(err);
            });
        });
    }
}
