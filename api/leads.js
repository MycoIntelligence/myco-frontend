function clean(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

function field(label, value) {
  return `<tr><td style="padding:6px 14px 6px 0;color:#566963;vertical-align:top">${label}</td><td style="padding:6px 0;color:#122024">${escapeHtml(value || "Not provided")}</td></tr>`;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ detail: "Method not allowed." });
  }

  const name = clean(request.body?.name, 120);
  const email = clean(request.body?.email, 254).toLowerCase();
  const repo = clean(request.body?.repo, 500);
  const message = clean(request.body?.message, 3000);
  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ detail: "Please provide your name and a valid work email." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PILOT_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("Pilot request email is not configured.");
    return response.status(503).json({ detail: "Pilot requests are temporarily unavailable. Please try again shortly." });
  }

  const subject = `New Myco pilot request — ${name}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:640px">
      <h2 style="margin:0 0 12px;color:#122024">New Myco pilot request</h2>
      <table style="border-collapse:collapse">${field("Name", name)}${field("Work email", email)}${field("Repository or org", repo)}${field("What they want Myco to catch", message)}</table>
    </div>`;

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: ["rodriguesgrege@gmail.com"],
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      console.error("Email provider rejected pilot request", await resendResponse.text());
      return response.status(502).json({ detail: "We could not send your request. Please try again shortly." });
    }

    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error("Pilot request delivery failed", error);
    return response.status(502).json({ detail: "We could not send your request. Please try again shortly." });
  }
}
