import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query('SELECT NOW()');
    
    return NextResponse.json({
      ok: true,
      version: "1.0",
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        version: "1.0",
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message
      },
      { status: 500 }
    );
  }
}