# VulanCore

This repository contains both the VulanCore landing page and the full VolunCore dashboard application.

## Structure

- `index.html`, `styles.css`, `assets/` - public landing page.
- `app/` - full React/Vite dashboard application.
- `app/windows-store/` - Microsoft Store subscription integration helpers for the future Windows/MSIX host.

## Run The App Locally

```powershell
cd app
npm install
npm run dev
```

## Build The App

```powershell
cd app
npm run build
```

The built dashboard is generated in `app/dist/`. For Microsoft Store packaging, the final Windows host should copy this build into the MSIX project and host it in WebView2.
