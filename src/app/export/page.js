"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExportPage() {

  const router = useRouter();

  const [likedTracks, setLikedTracks] = useState([]);
  const [tracksUris, setTracksUris] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        
      const likedTracksInLocalStorage = localStorage.getItem('likedTracks');
      if (likedTracksInLocalStorage) {
        const parsedLikedTracks = JSON.parse(likedTracksInLocalStorage);
        const token = localStorage.getItem('token');
        setLikedTracks(parsedLikedTracks);
        localStorage.removeItem('likedTracks');
      } else {
        router.push('/discover');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (likedTracks.length > 0) {
        const token = localStorage.getItem('token');
        exportPlaylist(token);
      }
    }
  }, [likedTracks]);

  async function exportPlaylist(accessToken) {
    const userId = localStorage.getItem('userId');
    const playlistName = 'Discoverer #1';
    const playlistDescription = 'A playlist generated by New Music Discoverer';

    const res = await fetch (`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: playlistName,
        description: playlistDescription,
        public: false,
      }),
    });

    const data = await res.json();
    const playlistId = data.id;

    await addTracksToPlaylist(accessToken, playlistId, likedTracks);
    
  }

  async function addTracksToPlaylist(accessToken, playlistId, tracks) {

    const uris = tracks.map((track) => track.uri);

    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
      uris
      }),
    });
  }

  return (
    <div>
      <h1>Export</h1>
    </div>
  );
}