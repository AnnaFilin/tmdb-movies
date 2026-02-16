# TMDB Movies App

React + Redux + Redux-Saga application for browsing movies from TMDB.

## Features

- Popular movies
- Now Playing
- Search
- Movie details page
- Favorites (persisted in localStorage)
- Keyboard navigation support

## Setup

1. Clone the repository:
   git clone <repo-url>
   cd tmdb-movies

2. Install dependencies:
   npm install

3. Create a `.env` file in the project root and add the following variables:
   VITE_TMDB_BASE_URL=https://api.themoviedb.org/3  
   VITE_TMDB_READ_TOKEN=your_tmdb_read_access_token_here  
   VITE_TMDB_TIMEOUT_MS=8000 

⚠️ Important:
- You must use the **TMDB API Read Access Token**, not the API key.
- You can generate it at: https://developer.themoviedb.org/
  
4. Start the development server:
   npm run dev

## Notes

- The app uses TMDB API.
- Environment variables are not committed to the repository.
