// Notion sync API stub (disabled by default)
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Notion sync is disabled.' }, { status: 503 });
}
