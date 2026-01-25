import nodemailer from "nodemailer";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getTransporter() {
  const host = must("SMTP_HOST");
  const port = Number(must("SMTP_PORT"));
  const secure = (process.env.SMTP_SECURE ?? "true") === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: must("SMTP_USER"),
      pass: must("SMTP_PASS"),
    },
  });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const from = must("EMAIL_FROM");
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
