import { supabasePublic } from "@/lib/supabase-public";

async function uploadToBucket(file: File, bucket: string, path: string) {
  const { error } = await supabasePublic.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabasePublic.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function attachImagesToProduct(
  productId: string,
  thumb: File,
  flip: File
) {
  const safeName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");

  const thumbPath = `thumbnails/${productId}-${Date.now()}-${safeName(thumb.name)}`;
  const flipPath = `flip/${productId}-${Date.now()}-${safeName(flip.name)}`;

  const thumbnailUrl = await uploadToBucket(thumb, "public-images", thumbPath);
  const flipagramUrl = await uploadToBucket(flip, "previews", flipPath);

  const { error } = await supabasePublic
    .from("products")
    .update({
      thumbnail_url: thumbnailUrl,
      flipagram_url: flipagramUrl,
    })
    .eq("id", productId);

  if (error) throw error;

  return { thumbnailUrl, flipagramUrl };
}