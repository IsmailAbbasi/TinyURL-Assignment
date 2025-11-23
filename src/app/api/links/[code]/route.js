import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/links/:code - Get stats for one code
export async function GET(request, { params }) {
  try {
    const { code } = params;
    
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

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/links/:code - Delete link
export async function DELETE(request, { params }) {
  try {
    const { code } = params;
    
    const result = await query(
      'DELETE FROM links WHERE code = $1 RETURNING *',
      [code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}