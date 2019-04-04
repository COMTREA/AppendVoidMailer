const mailer = require('nodemailer');
const odbc = require('odbc')();
const fs = require('fs');
const ejs = require('ejs');

const config = require('./config');

const odbcString = 'DRIVER={InterSystems ODBC};SERVER='+config.cachedb.ip+';PORT='+config.cachedb.port+';DATABASE='+config.cachedb.pmdb+';UID='+config.login.user+';PWD='+config.login.pass;

const SQL = {
    void: {
        count: fs.readFileSync('void/count.sql').toString(),
        new: fs.readFileSync('void/new.sql').toString(),
    },
    append: {
        count: fs.readFileSync('append/count.sql').toString(),
        new: fs.readFileSync('append/new.sql').toString(),
    }
}

// A array with all of our queued up emails to be sent. Appends/Voids are added and ONLY removed when successfully sent
var mailQueue = [];

if (fs.existsSync('./mailQueue.json')) {
    mailQueue = JSON.parse(fs.readFileSync('./mailQueue.json'));
}

// Create mail transporter
const mail = mailer.createTransport({
    service: config.mail.service,
    auth: config.mail,
    pool: true,
    maxConnections: 3
});

// Custom logging with timestamp
async function Log(str) {
    const date = new Date();
    const data = (JSON.stringify(str) || str);
    const string = '[' + date + '] ' + data;

    console.log(string);
    fs.appendFile('log', string + '\n', function() {

    });
}

async function ConnectToDB() {
    let promise = new Promise(function(resolve, reject) {

        odbc.open(odbcString, function(err) {
            if (err) {Log(err);}
            resolve();
        });
    });

    return promise;
}

// Checks our mail queue, if it has stuff it will attempt to send them and remove from queue
async function MailQueuedItems() {
    mailQueue.forEach(function(item) {
        let mailOpts = {
            from: config.mail.user,
            to: config.mail.receiver,
            subject: item.subjectLine,
            html: item.body
        }

        mail.sendMail(mailOpts, function(err, info) {
            if (err) {
                Log(item.type+' failed to send. Added back to queue.');
            } else {
                mailQueue.splice(mailQueue.indexOf(item),1);
                Log(item.type+' successfully sent');
            }

            UpdateQueueFile();
        });
    });
}

// Update our queuefile mailQueue.json with current mailQueue data
async function UpdateQueueFile() {
    fs.writeFile('./mailQueue.json', JSON.stringify(mailQueue), function(err) {
        if (err) { 
            Log('ERROR WRITING QUEUE: '+err);
        }
    });
}

// Checks both our states and makes sure our connection isn't staying open
async function CheckStates() {
    let checkPromise = new Promise(async function(resolve, reject) {
        await ConnectToDB();
        await UpdateState('append');
        await UpdateState('void');
        odbc.close();

        // If user wants to send mail after checking, do so
        if (config.sendMailWithCheck) {
            MailQueuedItems();
        }

        resolve();
    });

    return checkPromise;
}

// Verifies new [type] exists, if so it returns the rows and updates the state.json
async function UpdateState(type) {
    // Query for our current count
    let countPromise = new Promise(function(resolve, reject) {
        odbc.query(SQL[type].count, function(err, rows) {
            if (err) {
                Log(err);
                reject();
            } else {
                resolve(rows[0].count);
            }
        });
    });

    let count = await countPromise;

    var state = {};
    if (!fs.existsSync('./state.json')) {
        state[type] = count;
        fs.writeFileSync('./state.json', JSON.stringify(state));
    } else {
        state = JSON.parse(fs.readFileSync('./state.json'));
        if (!state[type]) {
            state[type] = count;
            fs.writeFileSync('./state.json', JSON.stringify(state));
        }
    }
    //let state = { append: 11550, void: 8790 }; // TESTING

    let newRowsPromise = new Promise(function(resolve, reject) {
        if (state[type] < count) {
            // Void/Append query take different formats (count vs last id)
            var replCount;
            switch (type) {
                case 'void':
                    replCount = count - state[type];
                    break;
                case 'append':
                    replCount = state[type];
                    break;
                default:
                    Log('INVALID TYPE PROVIDED');
                    break;
            }

            // Since we have new ones, pulls them and calls AddToQueue
            odbc.query(SQL[type].new.replace('{count}', replCount), function(err, rows) {
                if (err) {
                    Log(err);
                } else {
                    AddToQueue(type, rows);

                    // Read the state file to rewrite. Doing this cause async
                    var currentState = JSON.parse(fs.readFileSync('./state.json'));
                    currentState[type] = count;
                    fs.writeFileSync('./state.json', JSON.stringify(currentState));
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
            
    return newRowsPromise;
}

// Takes our data, converts it with EJS and adds the it to our mail queue
async function AddToQueue(type, data) {
    data.forEach(async function(each) {
        // Building our subject line variable
        var serviceProgram = each['program_value'];

        let replaceableData = each;
        replaceableData['type'] = type.toUpperCase();

        let subjectLine = await ejs.render(config.mailSettings.subjectLine, replaceableData);

        ejs.renderFile(type+'/template.ejs', each, function(err, html) {
            mailQueue.push({ subjectLine:  subjectLine, body: html, type });
        });
    });

    UpdateQueueFile();
}

//////////////////////////////////////////////////////////////////////////////////////////////
// Process
//////////////////////////////////////////////////////////////////////////////////////////////

// Run our functions at startup, afterwards is handled by setInterval
async function InitialCheck() {
    await CheckStates();
    if (!config.sendMailWithCheck) { MailQueuedItems(); }
}

// Start getting to work!
Log('Started Mailer!');

// Repeat on interval
setInterval(CheckStates, (config.checkNew)*1000);
if (!config.sendMailWithCheck) { setInterval(MailQueuedItems, (config.sendMail)*1000); }

InitialCheck();