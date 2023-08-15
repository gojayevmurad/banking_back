import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "muradgojayevv@gmail.com",
    pass: "aslqcbcihpaozmad",
  },
});

const mailOptions = {
  from: "muradgojayevv@gmail.com",
  subject: "TAGIH email verification",
};

const sendMail = (userEmail, html) => {
  return transporter.sendMail({
    ...mailOptions,
    to: userEmail,
    html,
  });
};

export { sendMail };
