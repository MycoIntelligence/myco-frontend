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

const workEmailSchema = z.string().trim().email("Please enter a valid email address.").max(254);

export const trialEmailSchema = workEmailSchema
  .refine((email) => !FORBIDDEN_DOMAINS.includes(email.split("@")[1]?.toLowerCase()), {
    message: "Please enter your company email address.",
  });

export const trialGitHubUsernameError = "Please enter the correct GitHub username.";
const githubProfilePattern = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-z0-9-]+)\/?(?:[?#]\S*)?$/i;

export const trialGitHubUsernameSchema = z.string().trim()
  .max(256, trialGitHubUsernameError)
  .transform((value) => {
    const profile = githubProfilePattern.exec(value);
    return (profile?.[1] ?? value.replace(/\s+/g, "-")).toLowerCase();
  })
  .pipe(z.string().max(39, trialGitHubUsernameError)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, trialGitHubUsernameError));

const leadFields = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  workEmail: workEmailSchema,
  message: z.string().max(600, "Notes cannot exceed 600 characters.").optional(),
  website: z.string().optional(),
});

const companySchema = z.string({ required_error: "Company name is required." }).trim().min(1, "Company name is required.").max(200);

export const trialRequestSchema = leadFields.omit({ fullName: true, message: true }).extend({
  kind: z.enum(["trial", "upgrade"]),
  developerCount: z.string().refine((value) => value === "" || /^[1-9][0-9]{0,8}$/.test(value), "Enter a positive whole number.").optional(),
  firstName: z.string({ required_error: "First name is required." }).trim().min(1, "First name is required.").max(60),
  lastName: z.string({ required_error: "Last name is required." }).trim().min(1, "Last name is required.").max(60),
  workEmail: trialEmailSchema,
  githubUsername: trialGitHubUsernameSchema,
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


export const betaRequestSchema = leadFields.extend({
  kind: z.literal("beta"),
  feature: z.enum(["Pre-Prod Validation", "Production Monitoring"]),
  workEmail: trialEmailSchema,
  message: z.string().trim().min(1, "Tell us what you’d like to try.").max(600),
});

export type BetaRequestData = z.infer<typeof betaRequestSchema>;
