'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Access the window object only on the client-side
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        redirectToAuthCodeFlow(clientId);
      } else if (!localStorage.getItem('token')) {
        getAccessToken(clientId, code);
        router.push('/discover');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('token');
      fetchProfile(accessToken);
    }
  }, []);

  async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem('verifier', verifier);
    localStorage.removeItem('token');

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('response_type', 'code');
    params.append('redirect_uri', 'https://20sec-mu.vercel.app/login');
    params.append('scope', 'user-read-private user-read-email user-top-read user-modify-playback-state user-read-playback-state user-read-currently-playing streaming playlist-modify-public playlist-modify-private');
    params.append('code_challenge_method', 'S256');
    params.append('code_challenge', challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  function generateCodeVerifier(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem('verifier');

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', 'https://20sec-mu.vercel.app/login');
    params.append('code_verifier', verifier);

    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const { access_token } = await result.json();
    localStorage.setItem('token', access_token);
    fetchProfile();
    return access_token;
  }

  async function fetchProfile() {
    const token = localStorage.getItem('token');
    const result = await fetch('https://api.spotify.com/v1/me', {
      method: 'GET', headers: { Authorization: `Bearer ${token}` },
    });
    const profileData = await result.json();
    localStorage.setItem('userId', profileData.id);
  }
}
