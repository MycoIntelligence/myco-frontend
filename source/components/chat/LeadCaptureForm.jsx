import React, { useState } from "react";

export default function LeadCaptureForm({ prefilledQuestion, onDismiss, conversationContext }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState(prefilledQuestion || "");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Please provide your name.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid work email.";
    }
    if (!question.trim()) newErrors.question = "Please describe your question.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/chat/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          question: question.trim(),
          company: company.trim(),
          phone: phone.trim(),
          consent,
          conversationContext: conversationContext || [],
          pageUrl: window.location.href,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to submit. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="myco-chat-escalation-card">
        <div className="myco-chat-alert--success">
          <strong>Inquiry Received!</strong>
          <p style={{ margin: "4px 0 0" }}>
            Thank you, {name}! Your question has been forwarded to our engineering team. We'll follow up shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="myco-chat-escalation-card" role="region" aria-label="Contact details form">
      <h4 className="myco-chat-escalation-card__title">Would you like our engineering team to follow up?</h4>
      <p className="myco-chat-escalation-card__desc">Leave your contact details and our team will get back to you with the answer.</p>
      <form className="myco-chat-form" onSubmit={handleSubmit} noValidate>
        <div className="myco-chat-form__group">
          <label className="myco-chat-form__label" htmlFor="react-esc-name">Name <span className="req">*</span></label>
          <input
            id="react-esc-name"
            type="text"
            className={`myco-chat-form__input ${errors.name ? "is-invalid" : ""}`}
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
          {errors.name && <span className="myco-chat-form__error-text">{errors.name}</span>}
        </div>

        <div className="myco-chat-form__group">
          <label className="myco-chat-form__label" htmlFor="react-esc-email">Work Email <span className="req">*</span></label>
          <input
            id="react-esc-email"
            type="email"
            className={`myco-chat-form__input ${errors.email ? "is-invalid" : ""}`}
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
          />
          {errors.email && <span className="myco-chat-form__error-text">{errors.email}</span>}
        </div>

        <div className="myco-chat-form__group">
          <label className="myco-chat-form__label" htmlFor="react-esc-question">Your Question <span className="req">*</span></label>
          <textarea
            id="react-esc-question"
            className={`myco-chat-form__textarea ${errors.question ? "is-invalid" : ""}`}
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={2000}
          />
          {errors.question && <span className="myco-chat-form__error-text">{errors.question}</span>}
        </div>

        <div className="myco-chat-form__group">
          <label className="myco-chat-form__label" htmlFor="react-esc-company">Company (Optional)</label>
          <input
            id="react-esc-company"
            type="text"
            className="myco-chat-form__input"
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={150}
          />
        </div>

        <div className="myco-chat-form__group">
          <label className="myco-chat-form__label" htmlFor="react-esc-phone">Phone / WhatsApp (Optional)</label>
          <input
            id="react-esc-phone"
            type="tel"
            className="myco-chat-form__input"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={50}
          />
        </div>

        <label className="myco-chat-form__consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>I agree to have Myco contact me regarding this inquiry.</span>
        </label>

        {status === "error" && (
          <div className="myco-chat-alert--error">{errorMessage}</div>
        )}

        <div className="myco-chat-form__actions">
          <button type="submit" className="myco-chat-btn-submit" disabled={loading}>
            <span>{loading ? "Sending..." : "Send to Team"}</span>
          </button>
          <button type="button" className="myco-chat-btn-cancel" onClick={onDismiss}>
            Continue Chatting
          </button>
        </div>
      </form>
    </div>
  );
}
