import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GymTracker',
    short_name: 'GymTracker',
    description: 'Track your workouts and sync with Google Health',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#22c55e',
    icons: [
      {
        src: '/icon.jpg',
        sizes: 'any',
        type: 'image/jpeg',
      },
      {
        src: '/apple-icon.jpg',
        sizes: '180x180',
        type: 'image/jpeg',
      },
    ],
  }
}
