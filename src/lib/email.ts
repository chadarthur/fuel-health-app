/**
 * Minimal email sender. Uses Resend (resend.com) when RESEND_API_KEY is set;
 * otherwise logs the message to the server console so the flow still works in dev.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "FUEL <onboarding@resend.dev>";

  if (!apiKey) {
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    console.log(`[email] RESEND_API_KEY not set — email to ${to} not sent.`);
    console.log(`[email] Subject: ${subject}`);
    console.log(`[email] Body:\n${html.replace(/<[^>]+>/g, "")}`);
    if (links.length) console.log(`[email] Links: ${links.join(" ")}`);
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] Resend error:", res.status, text);
    return { sent: false };
  }

  return { sent: true };
}
