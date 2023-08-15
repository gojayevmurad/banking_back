import emailValidator from "deep-email-validator";

export const isEmailValid = async (email) => {
  return emailValidator.validate(email);
};
