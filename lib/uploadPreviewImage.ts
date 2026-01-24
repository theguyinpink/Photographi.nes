import { createBrowserClient } from "@supabase/ssr";

function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function safeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

export async function uploadPreviewImageToSupabase(params: {
  productId: string;
  file: File;
}) {
  const supabase = supabaseBrowser();

  const safeName = safeFilename(params.file.name);
  const path = `flip/${params.productId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("previews")
    .upload(path, params.file, {
      upsert: true,
      contentType: params.file.type || "image/png",
      cacheControl: "3600",
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("previews").getPublicUrl(path);
  return data.publicUrl;
}
