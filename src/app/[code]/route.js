import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // ✅ Await params in Next.js 15+
    const { code } = await params;
    
    console.log('🔍 Redirect requested for code:', code);
    
    // 1. Validate code format
    if (!/^[A-Za-z0-9]{6,8}$/.test(code)) {
      console.log('❌ Invalid code format:', code);
      return new NextResponse('Not Found', { status: 404 });
    }

    // 2. Find link in database
    const result = await query(
      'SELECT * FROM links WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      console.log('❌ Code not found in database:', code);
      return new NextResponse('Not Found', { status: 404 });
    }

    const link = result.rows[0];
    console.log('✅ Found link:', link.target_url);
    console.log('📊 Current clicks:', link.total_clicks);

    // 3. ✅ FIX: AWAIT the update to ensure it completes
    try {
      await query(
        'UPDATE links SET total_clicks = total_clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1',
        [code]
      );
      console.log('✅ Click count updated successfully');
    } catch (updateError) {
      console.error('❌ Failed to update stats:', updateError);
      // Continue with redirect even if update fails
    }
    
    console.log('✅ Redirecting to:', link.target_url);

    // 4. Redirect to target URL (HTTP 302)
    return NextResponse.redirect(link.target_url, 302);
  } catch (error) {
    console.error('❌ Error handling redirect:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}