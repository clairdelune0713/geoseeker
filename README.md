# GeoSeeker 🌍🔍

A GeoGuessr-style hide-and-seek game powered by Gemini AI. The AI picks a random, well-known location on Earth and gives you cryptic hints — your job is to find it using Street View and your geography skills!

<div align="center">
  <img src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" alt="GeoSeeker Banner" />
</div>

## How to Play

1. **Join the game** — Enter your name to start playing as the Seeker.
2. **Pick a zone** — Choose from Global, Europe, North America, Hong Kong, or Major Cities.
3. **Start the game** — Gemini AI randomly picks a hiding spot and gives you a playful hint.
4. **Make your guesses** — Use Street View to navigate and drop up to 3 pins on the map.
5. **Get closer** — After each guess, you'll see the distance and direction to the hidden location.

## Available Zones

| Zone | Description |
|------|-------------|
| 🌍 Global (Anywhere) | 30 famous landmarks worldwide |
| 🇪🇺 Europe Only | 20 iconic European locations |
| 🌎 North America | 20 landmarks across the continent |
| 🇭🇰 Hong Kong | 20 well-known spots around Hong Kong |
| 🏛️ Major Cities | 20 world-famous city landmarks |

## Features

- **AI-powered hints** — Gemini generates playful, cryptic hints about the hiding location
- **Multiple zones** — Choose from 5 different geographic zones
- **Distance & bearing feedback** — See how far and in which direction you are from the target
- **Up to 3 guesses per round** — Strategize your pin drops

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Map:** Mapbox GL JS
- **Street View:** Google Street View Static API
- **AI:** Google Gemini API

## Prerequisites

- Node.js 18+
- A [Gemini API key](https://ai.google.dev/)

## Run Locally

```bash
# Install dependencies
npm install

# Set your Gemini API key
# Create a .env.local file with:
GEMINI_API_KEY=your_api_key_here

# Start the development server
npm run dev
```

## Build for Production

```bash
npm run build
```

## Project Structure

```
├── src/
│   ├── components/       # React components (GameMap, GameSidebar, StreetView, etc.)
│   ├── context/          # Game state management (GameContext)
│   ├── services/         # Gemini AI service integration
│   ├── constants.ts      # Zone definitions and curated place locations
│   ├── types.ts          # TypeScript type definitions
│   └── App.tsx           # Main application component
├── server.ts             # Local development server
└── vite.config.ts        # Vite configuration
```

## View in AI Studio

[https://ai.studio/apps/bundled/geoseeker](https://ai.studio/apps/bundled/geoseeker)