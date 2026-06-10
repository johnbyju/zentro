import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getServerToken(): string {
  return (
    process.env.HUGGING_FACE_TOKEN?.trim() ||
    process.env.HF_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN?.trim() ||
    ''
  );
}

export async function GET() {
  const token = getServerToken();
  return NextResponse.json({ configured: !!token });
}
