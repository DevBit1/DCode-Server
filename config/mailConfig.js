const { createTransport } = require('nodemailer')



// If we just assign "transporter" -->  "createTransport" the process.env.values won't be there since they haven't been parsed yet
// But making it a function will provide values to "process.env" since it will depend on where we call it
exports.transporter = () =>{
    return createTransport({
        service: 'Gmail',
        auth: {
            user: `${process.env.EMAIL_USER}`,
            pass: `${process.env.EMAIL_PASS}`
        }
    })
}