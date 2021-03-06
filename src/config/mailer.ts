const nodemailer = require("nodemailer");
import { getRepository } from "typeorm";
import { Book } from "../entity/book.entity";
import { environment } from "./environment";

const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: environment.E_MAIL_USERNAME,
    pass: environment.E_MAIL_PASSWORD,
  },
});
export const sendEmailJob = async () => {
  try {
    const bookRepository = getRepository(Book);
    const bookUsers = await bookRepository.find({
      relations: ["author", "author.books"],
    });
    const filteredLoanedBooks = bookUsers.filter(
      (item) => item.isOnloan === true
    );

    const options = {
      from: "ncilionode@outlook.com",
      to: "ncilionode@gmail.com",
      subject: "Weekly report",
      text: `Hola ${JSON.stringify(filteredLoanedBooks, undefined, 4)}`,
    };

    transporter.sendMail(options, function (err: any, info: any) {
      if (err) {
        console.log(err);
        return;
      }
      console.log("Sent: " + info.response);
    });
  } catch (e) {
    throw new Error(e);
  }
};
