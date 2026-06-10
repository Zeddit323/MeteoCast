# MeteoCast — Frontend

A responsive weather app built with React and Vite. Displays current conditions, a 7-day forecast, and key stats for any city. Supports user accounts with saved favorite cities.

---

## Tech stack

- **React 18** + **Vite**
- **OpenWeatherMap API** — current weather, forecast, UV index
- **Custom REST API** — authentication and favorite cities (see [meteocast-api](https://github.com/your-username/meteocast-api))

---

## Features

- Current weather with condition icon, temperature, feels-like, humidity, UV index, and pressure
- 7-day forecast with day/night icons and precipitation probability
- City search with autocomplete suggestions (OWM geocoding)
- Responsive layout — dedicated mobile and desktop views
- User accounts — register, log in, forgot/reset password
- Favorite cities — save and switch between cities from the side panel

---

## Getting started

### Prerequisites

- Node.js 18+
- An [OpenWeatherMap](https://openweathermap.org/api) API key (free tier works)
- The MeteoCast backend running locally or hosted

### Installation

```bash
git clone https://github.com/your-username/meteocast-frontend.git
cd meteocast-frontend
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
VITE_OPENWEATHER_API_KEY=your_owm_key_here
VITE_API_URL=http://localhost:3000/api
```

| Variable | Description |
|---|---|
| `VITE_OPENWEATHER_API_KEY` | OpenWeatherMap API key |
| `VITE_API_URL` | Base URL of the MeteoCast backend API. Defaults to `/api` if not set (useful when frontend and backend are on the same origin) |

### Vite proxy (local development)

If running the backend locally on the same machine, you can omit `VITE_API_URL` and use a Vite proxy instead. Add this to `vite.config.js`:

```js
server: {
  proxy: {
    '/api': 'http://localhost:3000' // replace with your backend port
  }
}
```

### Run

```bash
npm run dev
```

---

## Project structure

```
src/
├── api.js              # Fetch wrapper for all backend API calls
├── AuthContext.jsx     # Auth state, session detection, favorites
├── CitySearch.jsx      # Search bar with OWM autocomplete + favorite star
├── SidePanel.jsx       # Hamburger panel — login/register/favorites
├── useWeather.js       # Hook that fetches weather data from OWM
├── WeatherWidget.jsx   # Root widget — composes all components
├── DesktopLayout.jsx   # Desktop view (≥ 640px)
├── MobileLayout.jsx    # Mobile view (< 640px)
├── ForecastCol.jsx     # Single forecast column (desktop)
├── ForecastRow.jsx     # Single forecast row (mobile)
├── StatCard.jsx        # Humidity / UV / feels-like / pressure card
├── icons.jsx           # Icon component factory and icon map
├── data.js             # Default forecast data (shown before API loads)
└── weather.css         # All styles
```

---

## Deployment

The app is deployed on [Render](https://render.com) as a static site.

### Build command
```bash
npm run build
```

### Publish directory
```
dist
```

### Environment variables on Render

| Variable | Value |
|---|---|
| `VITE_OPENWEATHER_API_KEY` | Your OWM API key |
| `VITE_API_URL` | Full URL of your hosted backend, e.g. `https://meteocast-api.onrender.com/api` |

> **Note:** Vite bakes environment variables into the build at compile time. After changing any `VITE_*` variable you must trigger a redeploy for it to take effect.

---

## OWM API notes

The app tries **One Call API 3.0** first (`/data/3.0/onecall`). If the key isn't subscribed to that plan it automatically falls back to the free **2.5 endpoints** (`/data/2.5/weather`, `/data/2.5/forecast`, `/data/2.5/uvi`). UV index is fetched separately on the free tier.

---

## License

MIT
