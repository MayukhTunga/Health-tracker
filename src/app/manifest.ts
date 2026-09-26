import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GymTracker',
    short_name: 'GymTracker',
    description: 'Track your workouts and sync with Google Health',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#22c55e',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
