/**
 * Google Calendar OAuth Callback Handler
 * 
 * מטפל בחזרה מ-Google OAuth לאחר אישור המשתמש
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle error from Google
    if (error) {
        console.error('Google OAuth error:', error);
        return NextResponse.redirect(
            new URL(`/admin/integrations?error=${encodeURIComponent('המשתמש ביטל את ההרשאה')}`, request.url)
        );
    }

    // Validate code exists
    if (!code) {
        return NextResponse.redirect(
            new URL('/admin/integrations?error=missing_code', request.url)
        );
    }

    // Return HTML page that handles token exchange client-side
    // This allows us to store tokens in localStorage
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>מחבר ליומן Google...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255,255,255,0.2);
            border-top-color: #f59e0b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        h2 { margin: 0 0 0.5rem; font-weight: 600; }
        p { color: rgba(255,255,255,0.7); margin: 0; }
        .error { color: #f87171; }
        .success { color: #4ade80; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner" id="spinner"></div>
        <h2 id="title">מחבר ליומן Google...</h2>
        <p id="message">אנא המתן</p>
    </div>
    <script>
        const code = '${code}';
        const state = '${state || ''}';

        async function exchangeToken() {
            const spinner = document.getElementById('spinner');
            const title = document.getElementById('title');
            const message = document.getElementById('message');

            try {
                const response = await fetch('/api/auth/google-calendar/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });

                if (!response.ok) {
                    throw new Error('Failed to exchange token');
                }

                const tokens = await response.json();
                
                // Store tokens in localStorage
                const calendarTokens = {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresAt: Date.now() + (tokens.expires_in * 1000),
                    scope: tokens.scope
                };
                
                localStorage.setItem('google_calendar_tokens', JSON.stringify(calendarTokens));
                localStorage.setItem('google_calendar_last_sync', new Date().toISOString());

                // Show success
                spinner.style.display = 'none';
                title.textContent = '✅ החיבור הצליח!';
                title.classList.add('success');
                message.textContent = 'מעביר אותך חזרה למערכת...';

                // Redirect back
                setTimeout(() => {
                    window.location.href = '/admin/integrations?calendar=connected';
                }, 1500);

            } catch (error) {
                console.error('Token exchange error:', error);
                spinner.style.display = 'none';
                title.textContent = '❌ שגיאה בחיבור';
                title.classList.add('error');
                message.textContent = 'לא הצלחנו להתחבר ליומן. נסה שוב.';
                message.innerHTML += '<br><a href="/admin/integrations" style="color: #60a5fa; margin-top: 1rem; display: inline-block;">חזרה לאינטגרציות</a>';
            }
        }

        exchangeToken();
    </script>
</body>
</html>
    `;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
