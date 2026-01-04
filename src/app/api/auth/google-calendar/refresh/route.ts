/**
 * Google Calendar Token Refresh Endpoint
 * 
 * מרענן את ה-access token באמצעות refresh token
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { refreshToken } = await request.json();

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Missing refresh token' },
                { status: 400 }
            );
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('Missing Google OAuth credentials');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Refresh the token with Google
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token'
            })
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json().catch(() => ({}));
            console.error('Google token refresh failed:', error);
            return NextResponse.json(
                { error: error.error_description || 'Token refresh failed' },
                { status: 400 }
            );
        }

        const tokens = await tokenResponse.json();

        return NextResponse.json({
            access_token: tokens.access_token,
            expires_in: tokens.expires_in,
            scope: tokens.scope,
            token_type: tokens.token_type
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
