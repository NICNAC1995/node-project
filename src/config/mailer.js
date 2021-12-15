const nodemailer = require("nodemailer");
import { BookResolver } from  <script type="module" src="../resolvers/book.resolver"></script>;
let report = new BookResolver();
let realReport = report.getBooksOnLoanReport();

const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: "ncilionode@outlook.com",
    pass: "Peterete1234",
  },
});

const options = {
  from: "ncilionode@outlook.com",
  to: "ncilionode@gmail.com",
  subject: "Weekly report",
  text: `Hola ${realReport}`,
};

transporter.sendMail(options, function (err, info) {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Sent: " + info.response);
});

// export const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.E_MAIL_USERNAME,
//     pass: process.env.E_MAIL_PASSWORD,
//   },
// });

// // transporter.verify().then(() => {
// //   console.log("Ready for sending emails");
// // });

// let mailOptions = {
//   from: '"Weekly report" <ncilionode@gmail.com>',
//   to: "ncilionode@gmail.com",
//   subject: "Weekly report",
//   html: `<b> Hi Admin! Here is your weekly report. The following books are currently on loan: </b>`,
// };

// transporter.sendMail(mailOptions, (error: any, info: { messageId: any }) => {
//   if (error) {
//     return console.log(error);
//   }
//   console.log("Message sent: %s", info.messageId);
// });

// var transporter = nodemailer.createTransport({
//   service: "Gmail",
//   auth: {
//     user: "ncilionode@gmail.com",
//     pass: "bskoipqtpefhraty",
//   },
// });

// console.log("created");
// transporter.sendMail({
//   from: "ncilionode@gmail.com",
//   to: "ncilionode@gmail.com",
//   subject: "hello world!",
//   text: "hello world!",
// });
