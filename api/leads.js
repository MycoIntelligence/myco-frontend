function clean(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ detail: "Method not allowed." });
  }

  const name = clean(request.body?.name, 120);
  const email = clean(request.body?.email, 254).toLowerCase();
  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ detail: "Please provide your name and a valid work email." });
  }

  return response.status(201).json({ ok: true });
}
