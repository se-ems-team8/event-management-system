
const { z } = require("zod");

const registrationRequestSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[+0-9()\-\s]{7,20}$/, "Enter a valid phone number.")
    .refine(
      value => value.replace(/\D/g, "").length >= 7,
      "Enter a valid phone number."
    ),

  college: z
    .string()
    .trim()
    .min(2, "College name must contain at least 2 characters.")
    .max(150, "College name cannot exceed 150 characters."),

  department: z
    .string()
    .trim()
    .min(2, "Department must contain at least 2 characters.")
    .max(100, "Department cannot exceed 100 characters."),

  externalFormSubmitted: z
    .boolean()
    .refine(
      value => value === true,
      "Please confirm that you have submitted the external Google Form."
    )
}).strict();

function validateRegistrationRequest(input) {
  return registrationRequestSchema.safeParse(input);
}

module.exports = {
  registrationRequestSchema,
  validateRegistrationRequest
};
