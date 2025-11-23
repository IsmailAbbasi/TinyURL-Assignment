import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/links - Create a new link
export async function POST(request) {
  try {
    const body = await request.json();
    const { target_url, code } = body;

    // Validate URL
    if (!target_url || !isValidURL(target_url)) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    let shortCode = code;

    // If custom code provided, validate it
    if (shortCode) {
      if (!isValidCode(shortCode)) {
        return NextResponse.json(
          { error: 'Code must be 6-8 alphanumeric characters' },
          { status: 400 }
        );
      }

      // Check if code already exists
      const existing = await query(
        'SELECT code FROM links WHERE code = $1',
        [shortCode]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: 'Code already exists' },
          { status: 409 }
        );
      }
    } else {
      // Generate random code
      shortCode = generateRandomCode();

      // Ensure uniqueness (retry up to 5 times)
      let attempts = 0;
      while (attempts < 5) {
        const existing = await query(
          'SELECT code FROM links WHERE code = $1',
          [shortCode]
        );
        if (existing.rows.length === 0) break;
        shortCode = generateRandomCode();
        attempts++;
      }

      if (attempts === 5) {
        return NextResponse.json(
          { error: 'Failed to generate unique code' },
          { status: 500 }
        );
      }
    }

    // Insert the new link
    const result = await query(
      'INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *',
      [shortCode, target_url]
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

// GET /api/links - List all links
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let queryText = 'SELECT * FROM links ORDER BY created_at DESC';
    let params = [];

    if (search) {
      queryText = `
        SELECT * FROM links 
        WHERE code ILIKE $1 OR target_url ILIKE $1
        ORDER BY created_at DESC
      `;
      params = [`%${search}%`];
    }

    const result = await query(queryText, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}