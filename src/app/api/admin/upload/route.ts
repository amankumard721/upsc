import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client for Cloudflare R2
const getR2Client = () => {
  const endpoint = process.env.R2_ENDPOINT || 'https://6743ea22b860660512156b0dbe7638d7.r2.cloudflarestorage.com';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'Audio ppodcst polity';

    if (!file) {
      return NextResponse.json({ error: 'No file selected.' }, { status: 400 });
    }

    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({ 
        error: 'Cloudflare R2 credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are missing in environment variables (.env.local).' 
      }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Sanitize filename to avoid weird character issues
    const sanitizedFileName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
    const key = `${folder}/${Date.now()}-${sanitizedFileName}`;

    const bucketName = process.env.R2_BUCKET_NAME || 'audiopodcast';
    const r2Client = getR2Client();

    // Upload to R2 Bucket
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Build the public link URL
    // Try to get custom domain or default dev domain
    const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://pub-6743ea22b860660512156b0dbe7638d7.r2.dev`;
    const publicUrl = `${publicBaseUrl}/${key}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: file.name,
      key: key
    });
  } catch (error: any) {
    console.error('R2 Upload API Error:', error);
    return NextResponse.json({ error: error.message || 'File upload failed.' }, { status: 500 });
  }
}
