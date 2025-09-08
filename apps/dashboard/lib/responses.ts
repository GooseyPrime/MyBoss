import { NextResponse } from 'next/server';

export function ok(data: any) {
  return NextResponse.json(data, { status: 200 });
}

export function badRequest(zodError: any) {
  return NextResponse.json({ error: 'bad request', details: zodError }, { status: 400 });
}

export function server(error: any) {
  return NextResponse.json({ error: 'server error', details: String(error) }, { status: 500 });
}
