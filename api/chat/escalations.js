// Vercel Serverless Function: POST /api/chat/escalations
// Handles visitor question escalations, lead capture, input validation, and Resend notifications.

function clean(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function stripNewlines(value) {
  return typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim() : "";
}

function configuredRecipients(value) {
  return (value || "")
    .split(",")
    .map((recipient) => recipient.trim().toLowerCase())
    .filter((recipient) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient));
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

function field(label, value) {
  return `<tr><td style="padding:6px 14px 6px 0;color:#566963;vertical-align:top;font-weight:600">${label}</td><td style="padding:6px 0;color:#122024">${escapeHtml(value || "Not provided")}</td></tr>`;
}

// In-memory rate limiting map for serverless execution instance
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const MAX_REQUESTS = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const history = rateLimitMap.get(ip) || [];
  const valid = history.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, valid);
  if (valid.length >= MAX_REQUESTS) {
    return true;
  }
  valid.push(now);
  return false;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false, error: "Method not allowed." });
  }

  const clientIp = request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "127.0.0.1";
  if (isRateLimited(clientIp)) {
    return response.status(429).json({
      success: false,
      error: "Too many requests. Please wait a few minutes before submitting another inquiry.",
    });
  }

  const body = request.body || {};

  // Honeypot spam check
  if (body.website || body._honey) {
    return response.status(400).json({ success: false, error: "Spam detected." });
  }

  const name = stripNewlines(clean(body.name, 120));
  const email = stripNewlines(clean(body.email, 254).toLowerCase());
  const question = clean(body.question, 2000);
  const company = stripNewlines(clean(body.company, 150));
  const phone = stripNewlines(clean(body.phone, 50));
  const pageUrl = clean(body.pageUrl || body.page_url, 500);
  const consent = Boolean(body.consent);

  if (!name) {
    return response.status(400).json({ success: false, error: "Please provide your name." });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ success: false, error: "Please provide a valid work email." });
  }

  if (!question) {
    return response.status(400).json({ success: false, error: "Please provide your question." });
  }

  // Conversation context
  const rawContext = Array.isArray(body.conversationContext) ? body.conversationContext : [];
  const context = rawContext.slice(-8).map((msg) => ({
    sender: clean(msg.sender, 20) || "visitor",
    text: clean(msg.text, 500),
  })).filter((m) => m.text);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PILOT_EMAIL_FROM;
  const recipients = configuredRecipients(process.env.CHAT_ESCALATION_EMAIL_TO || process.env.PILOT_EMAIL_TO);

  const submissionId = `esc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (!apiKey || !from || recipients.length === 0) {
    console.warn("Escalation email credentials not fully configured; recording inquiry:", {
      id: submissionId,
      name,
      email,
      question,
    });
    return response.status(201).json({
      success: true,
      id: submissionId,
      message: "Your question has been received. Our team will follow up shortly.",
    });
  }

  const subject = `Myco Assistant Question from ${name}${company ? ` (${company})` : ""}`;
  let contextHtml = "";
  if (context.length > 0) {
    const contextItems = context
      .map((c) => `<div style="margin-bottom:6px"><strong>${c.sender === "user" ? "Visitor" : "Assistant"}:</strong> ${escapeHtml(c.text)}</div>`)
      .join("");
    contextHtml = `
      <div style="margin-top:16px;padding:12px;background:#F7F9F8;border:1px solid #D4DEDA;border-radius:6px">
        <strong style="color:#122024">Recent Conversation Context:</strong>
        <div style="margin-top:8px;font-size:13px;color:#425650">${contextItems}</div>
      </div>`;
  }

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;max-width:640px;color:#122024">
      <div style="border-bottom:2px solid #39756D;padding-bottom:12px;margin-bottom:16px">
        <h2 style="margin:0;color:#122024;font-size:20px">New Chat Assistant Escalation / Lead</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#566963">Submission ID: ${escapeHtml(submissionId)} · Date: ${new Date().toISOString()}</p>
      </div>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        ${field("Visitor Name", name)}
        ${field("Email Address", email)}
        ${field("Company", company)}
        ${field("Phone / WhatsApp", phone)}
        ${field("Page URL", pageUrl)}
        ${field("Consent Given", consent ? "Yes" : "No")}
      </table>
      <div style="margin-top:16px;padding:14px;background:#EDF2F0;border-left:4px solid #39756D;border-radius:4px">
        <strong style="color:#122024;display:block;margin-bottom:6px">Unanswered Question:</strong>
        <p style="margin:0;color:#122024;font-size:15px;white-space:pre-wrap">${escapeHtml(question)}</p>
      </div>
      ${contextHtml}
      <div style="margin-top:24px;padding-top:12px;border-top:1px solid #D4DEDA;font-size:12px;color:#778B84">
        Sent by Myco Website Assistant Escalation Service. Reply directly to this email to follow up with ${escapeHtml(name)}.
      </div>
    </div>`;

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend API rejected email", await resendResponse.text());
      return response.status(502).json({
        success: false,
        error: "We could not deliver your question to the team. Please try again shortly.",
      });
    }

    return response.status(201).json({
      success: true,
      id: submissionId,
      message: "Your question has been forwarded to our team. We'll be in touch shortly.",
    });
  } catch (err) {
    console.error("Chat escalation delivery error:", err);
    return response.status(502).json({
      success: false,
      error: "We encountered an error forwarding your question. Please try again shortly.",
    });
  }
}
