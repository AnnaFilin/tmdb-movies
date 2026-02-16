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

3. Create a `.env` file in the project root and add your TMDB API key:
   VITE_TMDB_API_KEY=your_api_key_here

4. Start the development server:
   npm run dev

## Notes

- The app uses TMDB API.
- You must create your own API key at https://developer.themoviedb.org/
- Environment variables are not committed to the repository.
