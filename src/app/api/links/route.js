import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Generate random 6-character code
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/links - Get all links or search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let result;
    if (search) {
      result = await query(
        'SELECT * FROM links WHERE code ILIKE $1 OR target_url ILIKE $1 ORDER BY created_at DESC',
        [`%${search}%`]
      );
    } else {
      result = await query('SELECT * FROM links ORDER BY created_at DESC');
    }

    // ✅ Always return an array, even if empty
    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching links:', error);
    // ✅ Return empty array on error instead of error object
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/links - Create new link
export async function POST(request) {
  try {
    const body = await request.json();
    const { target_url, code: customCode } = body;

    // Validate URL
    if (!target_url || !target_url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    // Use custom code or generate random one
    let code = customCode;
    if (!code) {
      // Generate unique code
      let attempts = 0;
      while (attempts < 10) {
        code = generateCode();
        const existing = await query('SELECT * FROM links WHERE code = $1', [code]);
        if (existing.rows.length === 0) break;
        attempts++;
      }
      if (attempts === 10) {
        return NextResponse.json(
          { error: 'Failed to generate unique code' },
          { status: 500 }
        );
      }
    } else {
      // Validate custom code format
      if (!/^[A-Za-z0-9]{6,8}$/.test(code)) {
        return NextResponse.json(
          { error: 'Code must be 6-8 alphanumeric characters' },
          { status: 400 }
        );
      }

      // Check if code already exists
      const existing = await query('SELECT * FROM links WHERE code = $1', [code]);
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: 'Code already exists' },
          { status: 409 }
        );
      }
    }

    // Insert new link
    const result = await query(
      'INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *',
      [code, target_url]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}