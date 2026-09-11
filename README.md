# Bean There

Bean There is a Kolkata coffee shop finder for discovering cafés by neighbourhood, amenities, price, and atmosphere. It combines a curated starter list with live café data from OpenStreetMap and displays results on an interactive map.

## Features

- Login and guest entry flow
- Search cafés by name, area, address, or tags
- Quick area suggestions for Kolkata neighbourhoods
- Filters for:
  - Wi-Fi
  - Power outlets
  - Open now
  - Price range
- Sort by recommended, rating, or price
- Interactive Leaflet map with café markers
- Save cafés to a personal favorites list
- Routed views for Discover, How it works, About, and Saved cafés
- Responsive desktop and mobile layout
- Curated fallback data when the public map API is unavailable
- GitHub Pages deployment through GitHub Actions

## Tech stack

- React
- Vite
- JavaScript
- Tailwind CSS
- Leaflet and React Leaflet
- Lucide React
- OpenStreetMap tiles
- Overpass API for live café data

## Getting started

### Requirements

- Node.js 20 or newer
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Login behavior

This project currently uses a client-side demo login flow. Any valid email address and a password with at least six characters will unlock the explorer. You can also select **Continue as a guest**.

The login state is stored in browser `localStorage` under `bean-there-auth`. Use the **Log out** button or visit `/#login` to return to the login screen.

This is not production authentication. For a real application, connect the form to an authentication provider and never store credentials in the browser.

## Routes

The app uses hash-based routes so it works on GitHub Pages without server-side rewrite configuration:

| Route | Purpose |
| --- | --- |
| `/#login` | Login screen |
| `/#discover` | Café finder and map |
| `/#how-it-works` | Product overview |
| `/#about` | About Bean There |
| `/#favorites` | Saved cafés |

## Data sources

Live café discovery uses the public [Overpass API](https://overpass-api.de/) and map tiles are provided by [OpenStreetMap](https://www.openstreetmap.org/).

Public APIs can be rate-limited or temporarily unavailable. Bean There keeps a curated local dataset in `src/data.js` so the core experience remains usable when live results cannot be loaded.

Please follow the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/) when deploying or scaling the project.

## Deploy to GitHub Pages

The repository includes a workflow at `.github/workflows/deploy.yml`.

1. Push the project to a GitHub repository.
2. Open the repository **Settings**.
3. Open **Pages** under **Code and automation**.
4. Set the Pages source to **GitHub Actions**.
5. Push to the `main` branch or manually run the **Deploy to GitHub Pages** workflow.

For this repository, the deployed URL is expected to be:

```text
https://rounokpaul.github.io/Bean-There/
```

The workflow installs dependencies with `npm ci`, runs `npm run build`, uploads the `dist` directory, and deploys it to GitHub Pages.

## Project structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── App.jsx
│   ├── data.js
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production bundle locally |

## Contributing

1. Create a branch for your change.
2. Install dependencies with `npm install`.
3. Make and test your changes locally.
4. Run `npm run build`.
5. Open a pull request with a clear summary and screenshots for visual changes.

## License

This project is provided for personal and educational use. Map data and map tiles remain subject to the terms of their respective providers.
