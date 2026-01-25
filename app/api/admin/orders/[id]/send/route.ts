import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient(
    must("NEXT_PUBLIC_SUPABASE_URL"),
    must("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

// Bucket de livraison (PRIVATE)
const DELIVERY_BUCKET = process.env.DELIVERY_BUCKET ?? "deliveries";
// Durée des liens signés (en secondes)
const SIGNED_URL_EXPIRES = Number(process.env.SIGNED_URL_EXPIRES ?? 60 * 60 * 24); // 24h

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // 1) Charger la commande (pour récupérer l’email)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id,status,email")
      .eq("id", id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: orderErr?.message ?? "Order not found" },
        { status: 404 }
      );
    }

    const to = String(order.email ?? "").trim();
    if (!to) {
      return NextResponse.json(
        { error: "Cette commande n'a pas d'email." },
        { status: 400 }
      );
    }

    // 2) Lire le form
    const form = await req.formData();
    const subjectRaw = String(form.get("subject") ?? "").trim();
    const messageRaw = String(form.get("message") ?? "").trim();

    const subject =
      subjectRaw || `Vos photos PhotographI.nes (commande ${order.id})`;

    const message =
      messageRaw || `Bonjour,\n\nMerci pour votre achat ! Voici vos photos :\n`;

    const files = form.getAll("files").filter(Boolean) as unknown as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier reçu. Ajoute au moins une photo." },
        { status: 400 }
      );
    }

    // 3) Upload + signed urls
    const uploaded: { name: string; path: string; url: string }[] = [];

    for (const file of files) {
      if (!file || typeof (file as any).arrayBuffer !== "function") continue;

      const ab = await file.arrayBuffer();
      const buffer = Buffer.from(ab);

      const safeName = sanitizeFilename(file.name || "photo.jpg");
      const ext = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
      const stamp = Date.now();
      const path = `orders/${order.id}/${stamp}-${randomId(6)}.${ext}`;

      const contentType =
        (file as any).type && String((file as any).type).includes("/")
          ? String((file as any).type)
          : "application/octet-stream";

      const { error: upErr } = await supabase.storage
        .from(DELIVERY_BUCKET)
        .upload(path, buffer, {
          contentType,
          upsert: false,
        });

      if (upErr) {
        return NextResponse.json(
          { error: `Upload failed: ${upErr.message}` },
          { status: 500 }
        );
      }

      const { data: signed, error: signErr } = await supabase.storage
        .from(DELIVERY_BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRES);

      if (signErr || !signed?.signedUrl) {
        return NextResponse.json(
          { error: `Signed URL failed: ${signErr?.message ?? "unknown"}` },
          { status: 500 }
        );
      }

      uploaded.push({
        name: safeName,
        path,
        url: signed.signedUrl,
      });
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier uploadé (format invalide ?)" },
        { status: 400 }
      );
    }

    // 4) Construire email
    const text =
      `${message}\n\n` +
      uploaded
        .map((u, i) => `${i + 1}. ${u.name}\n${u.url}`)
        .join("\n\n") +
      `\n\nBonne journée,\nPhotographI.nes`;

    const html =
      `<p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>` +
      `<ol>` +
      uploaded
        .map(
          (u) =>
            `<li><strong>${escapeHtml(u.name)}</strong><br/><a href="${u.url}" target="_blank" rel="noreferrer">${u.url}</a></li>`
        )
        .join("") +
      `</ol>` +
      `<p>Bonne journée,<br/>PhotographI.nes</p>`;

    // 5) Envoyer email
    await sendMail({ to, subject, text, html });

    // 6) Marquer la commande SENT
    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update({ status: "SENT", sent_at: now })
      .eq("id", order.id)
      .select("id,status,sent_at")
      .single();

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      uploaded: uploaded.map(({ name, url }) => ({ name, url })),
      order: updated,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string) {
  // enlève chemins + caractères relous
  const base = name.split("/").pop()?.split("\\").pop() ?? "photo.jpg";
  return base.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

function randomId(len: number) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
