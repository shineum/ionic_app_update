## Summary
ionic android version manage code

Tested environment:

"ionic": "6.12.3"

"@angular/core": "^11.2.5"

"cordova-plugin-advanced-http": "^3.1.0"

"@ionic-native/http": "^5.31.1"

"cordova-plugin-file": "^6.0.2"

"@ionic-native/file": "^5.31.1"

"com-darryncampbell-cordova-plugin-intent": "^2.0.0"

"@ionic-native/web-intent": "^5.31.1"


## Install dependencies
#### install advanced http
```bash
npm i cordova-plugin-advanced-http @ionic-native/http
```
#### install file
```bash
npm i cordova-plugin-file @ionic-native/file
```
#### install web intent
```bash
npm i com-darryncampbell-cordova-plugin-intent @ionic-native/web-intent
```
#### install angular core
```bash
npm i @angular/core
```

## Setup
Upload version_info.json and app binary files on your server.

/res/version_info.json

/res/builds/application.apk


## Usage
```javascript
import VersionChecker from './VersionChecker';

...

  checkUpdate() {
    let tVersionChecker = new VersionChecker({
      url: "https://example.com/res/version_info.json",    // recent app version info
      version: "0.0.1"                                          // read current app version
    });

    /////////////////////////////////////////////
    // simple version of example
    /////////////////////////////////////////////
    tVersionChecker.checkUpdate()
    .then((pHasUpdate) => {
      if (pHasUpdate) {
        tVersionChecker.downloadFile()
        .then(() => {
          tVersionChecker.runUpdate();
        });
      }
    });

    /////////////////////////////////////////////
    // complex version of example
    /////////////////////////////////////////////    
    // optional - loading start
    // check update
    tVersionChecker.checkUpdate()
    .then((pHasUpdate) => {
        return new Promise<void>((pfResolved)=>{
          if (pHasUpdate) {
            if (window.confirm("There is a newer version of application.\nDo you want to download it?")) {
              tVersionChecker.downloadFile()
              .then(() => {
                if (window.confirm("A latest version of application is ready.\nDo you want to install it now?")) {
                  tVersionChecker.runUpdate();
                }
              })
              .catch((err) => {
                alert("Download Error: " + err.status + "\n" + err.error);
              })
              .finally(() => {
                pfResolved();
              });
            } else {
              // will not download
              pfResolved();
            }
          } else {
            alert("No Update!");
            pfResolved();
          }
        });
      }
    )
    .catch((err) => {
      alert("Version Check Error: " + err.status + "\n" + err.error);
    })
    .finally(() => {
      // optional - loading end
    });
  }
```