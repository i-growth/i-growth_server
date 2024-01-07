import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "uc.chamod.public@gmail.com",
      pass: "jhqwpvtnluihkawp"
    },
  });