/**
 * Client-side alpha-keying for admin-uploaded option images.
 *
 * The customizer surfaces option diagrams on the ivory page background.
 * An admin uploading a PNG with a white card behind the artwork would
 * have it stick out like a sticker. We can't trust the admin to clean
 * their assets — so on upload we do it for them: any pixel whose RGB
 * is brighter than `threshold` and reasonably neutral becomes
 * transparent. The result is then re-encoded to PNG.
 *
 * Trims the transparent margin afterwards so the on-card sizing is
 * driven by the artwork, not by the source file's empty canvas.
 */

const DEFAULT_THRESHOLD = 235;

/** Returns a new PNG File with near-white pixels set transparent + tight-cropped. */
export async function alphaKeyToPng(
  file: File,
  threshold = DEFAULT_THRESHOLD,
): Promise<File> {
  const bitmap = await fileToBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");
  ctx.drawImage(bitmap, 0, 0);

  // Alpha-key: any near-white pixel with low chroma → fully transparent.
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Tight crop to the visible artwork (with small padding so glyphs don't
  // sit flush against the card edge).
  const cropped = tightCrop(canvas);
  const blob: Blob = await new Promise((resolve, reject) => {
    cropped.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
  const base = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.png`, { type: "image/png" });
}

/** Tight-crop a canvas to its non-transparent bounding box + 8px padding. */
function tightCrop(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext("2d");
  if (!ctx) return src;
  const { width: w, height: h } = src;
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return src;
  const pad = 8;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const right = Math.min(w, maxX + pad + 1);
  const bottom = Math.min(h, maxY + pad + 1);
  const out = document.createElement("canvas");
  out.width = right - left;
  out.height = bottom - top;
  const octx = out.getContext("2d");
  if (!octx) return src;
  octx.drawImage(src, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function fileToBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Safari sometimes refuses certain blobs — fall through */
    }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
