// Notion sync API stub (disabled by default)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Notion sync is disabled.' }, { status: 503 });
}
