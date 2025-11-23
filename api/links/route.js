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

    // Generate or validate code
    let shortCode = code;
    if (shortCode) {
      if (!isValidCode(shortCode)) {
        return NextResponse.json(
          { error: 'Code must be 6-8 alphanumeric characters' },
          { status: 400 }
        );
      }
    } else {
      // Generate random code
      shortCode = generateRandomCode();
      
      // Check if generated code exists (retry if needed)
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
    }

    // Try to insert
    try {
      const result = await query(
        'INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *',
        [shortCode, target_url]
      );

      return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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