# VolunCore

VolunCore is a local-first React dashboard foundation for NGO volunteer operations.

## Stack

- React with functional components and hooks
- Tailwind CSS with RTL-aware layout utilities
- react-i18next for English and Hebrew localization
- Recharts for operational analytics
- PapaParse for volunteer CSV import
- LocalStorage for local Windows-friendly persistence

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

If another Vite app already owns the default port, Vite will choose the next available local port.

## Project-Owned Terminal Output

Project scripts that print terminal text should call `writeTerminalText` from `scripts/terminal-text.cjs`.
