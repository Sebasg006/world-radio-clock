# World Radio Clock

Pick a city, see its local time on a live analog clock and listen to one of its radio stations.

**Live:** https://radio.sebasg.com

## Features

- Analog clock with a smooth second hand that changes between day and night for each city
- 14 cities with their local time and the difference from yours
- Live radio from each country (up to 15 of the most listened stations), with play/pause, previous/next and volume
- Stations that fail or stall are skipped automatically
- Keyboard: press the space bar to play or pause
- Works on desktop and mobile

## Stack

React 18 (Create React App), plain CSS, the `Intl` API for time zones and the free [Radio Browser](https://www.radio-browser.info) API for stations. No API keys needed.

## Run locally

```bash
npm install
npm start        # http://localhost:3000
npm test
npm run deploy   # build and publish to GitHub Pages
```

Built by [Sebastián Giraldo](https://sebasg.com).
