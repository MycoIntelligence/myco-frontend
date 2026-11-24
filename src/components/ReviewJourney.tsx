"use client";

import { useRef, useState } from "react";

const steps = [
  {
    label: "Requirements",
    kicker: "01 / Intended behaviour",
    heading: "Start with what the feature should do.",
    description: "The team agrees that a promotional credit should reduce the amount charged and appear on the invoice.",
    panelLabel: "Available requirement",
    panelTitle: "Promotional credit",
    panelBody: "Apply the credit to the checkout total and show the same credit on the customer’s invoice.",
    detailLabel: "Context",
    detail: "Myco can use relevant requirements when they are accessible to the review.",
  },
  {
    label: "Change",
    kicker: "02 / Proposed change",
    heading: "Follow the change beyond the diff.",
    description: "A pull request updates checkout. The invoice calculation is in surrounding code and may also need attention.",
    panelLabel: "Illustrative pull request",
    panelTitle: "Apply credit at checkout",
    panelBody: "Checkout total accounts for the promotional credit. The invoice calculation remains unchanged.",
    detailLabel: "Review scope",
    detail: "Myco reviews the change alongside accessible code and requirements, within the authorized scope.",
  },
  {
    label: "Finding",
    kicker: "03 / Review finding",
    heading: "Give the engineer a useful next step.",
    description: "Myco can explain the potential mismatch and the evidence behind it while the change is still fresh.",
    panelLabel: "Illustrative finding",
    panelTitle: "Invoice may not reflect the credit",
    panelBody: "Checkout applies the credit, but the related invoice calculation appears unchanged. This could produce an inconsistent amount.",
    detailLabel: "Investigate",
    detail: "Check the invoice calculation against the requirement. The engineer decides what to change and when to ship.",
  },
];

export function ReviewJourney() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const item = steps[active];

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % steps.length;
    else if (event.key === "ArrowLeft") next = (index + steps.length - 1) % steps.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = steps.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <section className="journey" id="review-journey" aria-labelledby="journey-title">
      <svg className="journey-landscape" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="1440" height="760" fill="#dce9dc" />
        <circle cx="1160" cy="160" r="115" fill="#eaf1e5" opacity=".7" />
        <path d="M0 440C190 310 312 344 484 405S798 492 990 371s310-95 450-34v423H0Z" fill="#c4dac8" />
        <path d="M0 544c183-117 346-89 492-25s310 85 466-2 316-92 482-10v253H0Z" fill="#a9cbb8" />
        <path d="M0 636c177-77 352-53 514-8s316 39 474-23 290-48 452 20v135H0Z" fill="#8fb9a4" />
        <path d="M0 446c190-130 312-96 484-35s314 87 506-34 310-95 450-34M0 550c183-117 346-89 492-25s310 85 466-2 316-92 482-10" fill="none" stroke="#f4f8ef" strokeOpacity=".55" />
      </svg>
      <div className="journey-inner">
        <div className="journey-heading">
          <p className="journey-eyebrow">A change, in context</p>
          <h2 id="journey-title">See how a finding comes together.</h2>
          <p>Follow an illustrative example from a requirement to a potential issue in review.</p>
        </div>
        <div className="journey-tabs" role="tablist" aria-label="Review example stages">
          {steps.map((step, index) => (
            <button key={step.label} ref={node => { refs.current[index] = node; }} id={`journey-tab-${index}`} type="button" role="tab" aria-selected={active === index} aria-controls={`journey-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => onKeyDown(event, index)}>
              <span aria-hidden="true">0{index + 1}</span>{step.label}
            </button>
          ))}
        </div>
        {steps.map((step, index) => (
          <div key={step.label} role="tabpanel" id={`journey-panel-${index}`} aria-labelledby={`journey-tab-${index}`} hidden={active !== index} tabIndex={0} className="journey-stage">
            {active === index && <><div className="journey-story"><p className="journey-eyebrow">{item.kicker}</p><h3>{item.heading}</h3><p>{item.description}</p><span className="journey-disclaimer">Illustrative example · Availability depends on accessible context</span></div><div className="journey-panel"><div className="journey-panel-top"><span>{item.panelLabel}</span><span>Myco review</span></div><div className="journey-panel-body"><h4>{item.panelTitle}</h4><p>{item.panelBody}</p><div className="journey-panel-detail"><span>{item.detailLabel}</span><p>{item.detail}</p></div></div></div></>}
          </div>
        ))}
      </div>
    </section>
  );
}
