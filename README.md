# AppendVoid Mailer
Monitors the append and void tables in Avatar. When new ones come in via the "Append Documents" and "Void Progress Notes" forms, a email will be sent to the specified email.

## Installing
* Install Node.JS (Current) from https://nodejs.org/en/
* Install 64-bit CacheDB Driver from ftp://ftp.intersys.com/pub/cache/odbc/2018/
* Run the install.bat (or you can manually run the install lines)

### Manual Install Commands
If you want to manually run or have to for some reason
```
npm i windows-build-tools
npm i
```

## Configuration
Rename default-config.js to config.js. You will need to enter your details into the config.js file. Please read the comments inside for what to fill in.

## Running Software
* Open Powershell/Command Prompt
* Enter 'node mailer.js' to run