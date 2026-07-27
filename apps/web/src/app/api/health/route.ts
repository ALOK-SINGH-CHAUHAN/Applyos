import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'web',
    timestamp: new Date().toISOString(),
  });
}
