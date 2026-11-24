"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Grain } from "@/components/ui/Grain";
import { Nav } from "@/src/components/Nav";
import { CtaFooter } from "@/src/components/CtaFooter";
import { demoFormSchema, type DemoFormData } from "@/lib/schema";

function BookDemoContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<DemoFormData>({
    fullName: "",
    workEmail: "",
    company: "",
    industry: "Payments",
    teamSize: "11 to 50",
    message: "",
    website: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DemoFormData, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fullNameRef = useRef<HTMLInputElement>(null);
  const workEmailRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const indParam = searchParams.get("industry");
    if (indParam) {
      const formatted =
        indParam.charAt(0).toUpperCase() + indParam.slice(1).toLowerCase();
      const validIndustries: DemoFormData["industry"][] = [
        "Payments",
        "Health platforms",
        "Commerce",
        "Energy grids",
        "Aviation",
        "Telecom",
        "Other",
      ];
      const match = validIndustries.find(
        (i) => i.toLowerCase() === formatted.toLowerCase()
      );
      if (match) {
        setFormData((prev) => ({ ...prev, industry: match }));
      }
    }

    const topicParam = searchParams.get("topic");
    if (topicParam === "enterprise") {
      setFormData((prev) => ({
        ...prev,
        message: prev.message || "Enterprise inquiry",
      }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof DemoFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError("");

    const result = demoFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof DemoFormData, string>> = {};
      let firstKey: keyof DemoFormData | null = null;

      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof DemoFormData;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
          if (!firstKey) firstKey = key;
        }
      });

      setErrors(fieldErrors);

      // Focus first error field
      if (firstKey === "fullName") fullNameRef.current?.focus();
      else if (firstKey === "workEmail") workEmailRef.current?.focus();
      else if (firstKey === "company") companyRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setSubmitError(data.message || "Request failed. Please try again.");
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setSubmitError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      id="main"
      data-nav-theme="light"
      className="relative min-h-[100svh] bg-[#c4e1df] text-[#071a1b] pt-[160px] pb-24 px-4 sm:px-9 lg:px-[clamp(20px,7vw,120px)] grain"
    >
      <Grain opacity={0.12} />

      <div className="relative z-10 max-w-[1600px] mx-auto grid grid-cols-1 min-[1000px]:grid-cols-12 gap-12 min-[1000px]:gap-14">
        {/* Left Column (6 cols) */}
        <div className="min-[1000px]:col-span-6 flex flex-col justify-start">
          <div className="mb-6">
            <Pill tone="mint">BOOK A WALKTHROUGH</Pill>
          </div>

          <h1 className="font-sans text-[clamp(36px,4.8vw,76px)] font-normal leading-[0.97] tracking-[-0.03em] uppercase text-[#071a1b] max-w-[14ch] [text-wrap:balance]">
            SEE MYCO IN YOUR WORKFLOW
          </h1>

          <p className="mt-6 text-[20px] leading-[1.4] text-[#44595a] max-w-[520px] [text-wrap:pretty]">
            Discuss an important pull request workflow and see how Myco reviews changes against available requirements and surrounding code.
          </p>

          <div className="flex flex-col gap-4 mt-12">
            {[
              "CHOOSE A WORKFLOW TO EVALUATE",
              "DISCUSS AVAILABLE CONTEXT AND PERMISSIONS",
              "AGREE ON WHAT USEFUL FEEDBACK LOOKS LIKE",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.06em] text-[#071a1b]"
              >
                <div className="w-5 h-5 rounded-full bg-[rgba(7,26,27,0.08)] flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={1.5} className="text-[#071a1b]" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Glass Form Card (6 cols) */}
        <div className="min-[1000px]:col-span-6 flex items-start">
          <div className="w-full bg-[rgba(255,255,255,0.5)] border border-[rgba(255,255,255,0.7)] backdrop-blur-[12px] rounded-[28px] p-6 sm:p-10 shadow-xl">
            {success ? (
              <div role="status" className="flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 rounded-full bg-[#5aa85a]/20 text-[#5aa85a] flex items-center justify-center mb-6">
                  <Check size={24} strokeWidth={2} />
                </div>
                <h3 className="font-sans text-[28px] font-normal tracking-[-0.02em] text-[#071a1b]">
                  Request received
                </h3>
                <p className="mt-3 text-[16px] text-[#44595a] max-w-[320px]">
                  Thank you. Your request has been sent.
                </p>
                <div className="mt-8">
                  <Button variant="primary" href="/">
                    Back to home
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {submitError && (
                  <p role="alert" className="rounded-lg border border-red-800/30 bg-red-50 p-3 text-sm text-red-900">{submitError}</p>
                )}
                {/* Honeypot field */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* 1. Full name */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="fullName"
                    className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#071a1b]"
                  >
                    Full name *
                  </label>
                  <input
                    ref={fullNameRef}
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    className="h-[48px] px-3.5 rounded-[10px] bg-[rgba(255,255,255,0.55)] border border-[rgba(7,26,27,0.22)] focus:border-[#071a1b] font-sans text-[16px] text-[#071a1b]"
                  />
                  {errors.fullName && (
                    <span id="fullName-error" className="font-mono text-[11px] text-[#d6523f]">
                      {errors.fullName}
                    </span>
                  )}
                </div>

                {/* 2. Work email */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="workEmail"
                    className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#071a1b]"
                  >
                    Work email *
                  </label>
                  <input
                    ref={workEmailRef}
                    id="workEmail"
                    type="email"
                    name="workEmail"
                    value={formData.workEmail}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.workEmail)}
                    aria-describedby={errors.workEmail ? "workEmail-error" : undefined}
                    placeholder="name@company.com"
                    className="h-[48px] px-3.5 rounded-[10px] bg-[rgba(255,255,255,0.55)] border border-[rgba(7,26,27,0.22)] focus:border-[#071a1b] font-sans text-[16px] text-[#071a1b]"
                  />
                  {errors.workEmail && (
                    <span id="workEmail-error" className="font-mono text-[11px] text-[#d6523f]">
                      {errors.workEmail}
                    </span>
                  )}
                </div>

                {/* 3. Company */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="company"
                    className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#071a1b]"
                  >
                    Company *
                  </label>
                  <input
                    ref={companyRef}
                    id="company"
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.company)}
                    aria-describedby={errors.company ? "company-error" : undefined}
                    className="h-[48px] px-3.5 rounded-[10px] bg-[rgba(255,255,255,0.55)] border border-[rgba(7,26,27,0.22)] focus:border-[#071a1b] font-sans text-[16px] text-[#071a1b]"
                  />
                  {errors.company && (
                    <span id="company-error" className="font-mono text-[11px] text-[#d6523f]">
                      {errors.company}
                    </span>
                  )}
                </div>

                {/* 4. Industry */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="industry"
                    className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#071a1b]"
                  >
                    Industry *
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="h-[48px] px-3.5 rounded-[10px] bg-[rgba(255,255,255,0.55)] border border-[rgba(7,26,27,0.22)] focus:border-[#071a1b] font-sans text-[16px] text-[#071a1b] cursor-pointer"
                  >
                    <option value="Payments">Payments</option>
                    <option value="Health platforms">Health platforms</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Energy grids">Energy grids</option>
                    <option value="Aviation">Aviation</option>
                    <option value="Telecom">Telecom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* 5. Team size */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="teamSize"
                    className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#071a1b]"
                  >
                    Team size *
                  </label>
                  <select
                    id="teamSize"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    className="h-[48px] px-3.5 rounded-[10px] bg-[rgba(255,255,255,0.55)] border border-[rgba(7,26,27,0.22)] focus:border-[#071a1b] font-sans text-[16px] text-[#071a1b] cursor-pointer"
                  >
                    <option value="1 to 10">1 to 10</option>
                    <option value="11 to 50">11 to 50</option>
                    <option value="51 to 200">51 to 200</option>
                    <option value="201 to 1000">201 to 1000</option>
                    <option value="1000 plus">1000 plus</option>
                  </select>
                </div>

                {/* 6. What should we test first? */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.06em] text-[#071a1b]">
                    <label htmlFor="message">What workflow would you like to evaluate?</label>
                    <span className="text-[#738585] text-[11px]">
                      {formData.message?.length || 0}/600
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    maxLength={600}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about a pull request workflow or dependency you would like to review..."
                    className="p-3.5 rounded-[10px] bg-[rgba(255,255,255,0.55)] border border-[rgba(7,26,27,0.22)] focus:border-[#071a1b] font-sans text-[16px] text-[#071a1b] resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="mt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full h-[48px] text-[13px]"
                  >
                    Request a pilot
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookDemoPage() {
  return (
    <>
      <Nav />
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#c4e1df] flex items-center justify-center font-mono text-[14px]">
            Loading form...
          </div>
        }
      >
        <BookDemoContent />
      </Suspense>
      <CtaFooter />
    </>
  );
}

