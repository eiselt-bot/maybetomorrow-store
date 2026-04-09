/**
 * POST /api/upload — admin-only file upload endpoint.
 *
 * Accepts a single multipart/form-data file under field name "file".
 * Validates content-type (image/*), size (<= 5 MB), generates a
 * random filename with the original extension, writes to UPLOAD_DIR
 * (default /var/mt-store/uploads), and returns JSON { url } where
 * the URL is relative to the PUBLIC_UPLOAD_URL prefix (default /uploads).
 *
 * The admin forms use <PhotoUpload /> which posts here and then writes
 * the returned URL into a hidden input on the main form.
 */

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import { auth } from '@/lib/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/mt-store/uploads';
const PUBLIC_UPLOAD_URL = process.env.PUBLIC_UPLOAD_URL || '/uploads';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function extFromType(type: string): string {
  switch (type) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.bin';
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid multipart form body' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string' || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'Missing "file" field' },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported type "${file.type}". Allowed: JPEG, PNG, WebP, GIF.`,
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB > 5 MB`,
      },
      { status: 413 },
    );
  }

  // Generate a safe random filename, preserving the extension from content-type
  // (the original file name is untrusted).
  const origExt = extname(file.name || '').toLowerCase();
  const safeExt =
    ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(origExt)
      ? origExt
      : extFromType(file.type);
  const rand = randomBytes(10).toString('hex');
  const filename = `${Date.now()}-${rand}${safeExt}`;

  // Ensure upload dir exists
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error('[upload] mkdir failed', e);
    return NextResponse.json(
      { error: 'Upload dir not writable' },
      { status: 500 },
    );
  }

  // Write file
  const target = `${UPLOAD_DIR}/${filename}`;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(target, buffer);
  } catch (e) {
    console.error('[upload] write failed', e);
    return NextResponse.json(
      { error: 'Failed to write uploaded file' },
      { status: 500 },
    );
  }

  const publicUrl = `${PUBLIC_UPLOAD_URL.replace(/\/$/, '')}/${filename}`;
  return NextResponse.json({ url: publicUrl, size: file.size, type: file.type });
}

export const runtime = 'nodejs';
