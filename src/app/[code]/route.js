import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { code } = params;
    
    if (!/^[A-Za-z0-9]{6,8}$/.test(code)) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    const result = await query(
      'SELECT * FROM links WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    const link = result.rows[0];

    await query(
      'UPDATE links SET total_clicks = total_clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1',
      [code]
    );

    return NextResponse.redirect(link.target_url, 302);
  } catch (error) {
    console.error('Error handling redirect:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}