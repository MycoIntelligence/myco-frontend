import { z } from "zod";

const FORBIDDEN_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
];

const workEmailSchema = z.string().trim().email("Please provide a valid email address.").max(254);

const leadFields = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  workEmail: workEmailSchema,
  message: z.string().max(600, "Notes cannot exceed 600 characters.").optional(),
  website: z.string().optional(),
});

const companySchema = z.string({ required_error: "Company name is required." }).trim().min(1, "Company name is required.").max(200);

export const trialRequestSchema = leadFields.omit({ fullName: true, message: true }).extend({
  kind: z.literal("trial"),
  firstName: z.string({ required_error: "First name is required." }).trim().min(1, "First name is required.").max(60),
  lastName: z.string({ required_error: "Last name is required." }).trim().min(1, "Last name is required.").max(60),
  githubUsername: z.string({ required_error: "GitHub username is required." }).trim()
    .max(39, "GitHub username must be 39 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Enter a GitHub username, such as alex-jones."),
}).transform((trial) => ({
  ...trial,
  fullName: `${trial.firstName} ${trial.lastName}`,
}));

export const demoFormSchema = leadFields.extend({
  workEmail: workEmailSchema.refine(
    (email) => !FORBIDDEN_DOMAINS.includes(email.split("@")[1]?.toLowerCase()),
    { message: "Please use your corporate work email, not a free email provider." }
  ),
  company: companySchema,
  industry: z.enum(
    [
      "Payments",
      "Health platforms",
      "Commerce",
      "Energy grids",
      "Aviation",
      "Telecom",
      "Other",
    ],
    {
      errorMap: () => ({ message: "Please select an industry." }),
    }
  ),
  teamSize: z.enum(
    ["1 to 10", "11 to 50", "51 to 200", "201 to 1000", "1000 plus"],
    {
      errorMap: () => ({ message: "Please select team size." }),
    }
  ),
});

export type DemoFormData = z.infer<typeof demoFormSchema>;
export type TrialRequestData = z.infer<typeof trialRequestSchema>;
