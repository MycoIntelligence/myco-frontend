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

export const trialRequestSchema = leadFields.extend({
  kind: z.literal("trial"),
});

export const demoFormSchema = leadFields.extend({
  workEmail: workEmailSchema.refine(
    (email) => !FORBIDDEN_DOMAINS.includes(email.split("@")[1]?.toLowerCase()),
    { message: "Please use your corporate work email, not a free email provider." }
  ),
  company: z.string().trim().min(1, "Company name is required.").max(200),
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
