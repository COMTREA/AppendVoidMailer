// Connection details for CacheDB
module.exports.cachedb = {
    ip: 'localhost', // If running Avatar on this machine, localhost is fine
    port: '4972',
    pmdb: 'AVPM'
}

// Avatar login to use with queries
module.exports.login = {
    user: 'LIVE:SYSADM',
    pass: ''
};

// Email details
module.exports.mail = {
    service: 'outlook', // outlook, gmail, etc  full list: https://nodemailer.com/smtp/well-known/
    user: '', // email sending the mail (we use our admin account)
    pass:'',
    receiver: '' // email that receives the sent mail
};

// Mail settings
//// subjectLine supports table fields + type (void/append) as options. Uses EJS to replace. 
//// MUST be consistent on the sql query. For example, service_program_value != program_value...so use 'as "program_value"'
module.exports.mailSettings = {
    subjectLine: '(<%=program_value%>) <%=type%> Progress Note'
}

// How often to refresh
module.exports.checkNew = 300; // How often to check for new voids/appends
module.exports.sendMail = 300; // How often to check the mail queue and send entries
module.exports.sendMailWithCheck = true; // If true, will ignore sendMail and send the mail after checking