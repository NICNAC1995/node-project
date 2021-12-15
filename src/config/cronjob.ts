const cron = require("node-cron");
let shell = require("shelljs");

cron.schedule("38 19 * * mon", function () {
  console.log("Sending email");
  if (shell.exec("node mailer.js").code !== 0) {
    console.log("Email sent");
  }
});
