# CLAUDE.md - Development Guide

This is the developer reference card for the Claude Certified Architect Prep & Lab Portal.

## Development Commands

- **Start Local Server (Python)**: `python -m http.server 8000` (Open [http://localhost:8000](http://localhost:8000))
- **Start Local Server (Node.js)**: `npx serve .` or `npm install -g serve && serve`
- **Linting & Validation**: Validate HTML and inspect JS console for module loading errors.

## Project Structure & Architecture

This is a complete, static single-page application (SPA) designed to load instantly and run fully client-side.
- **`index.html`**: Entry point. Sets up sidebar and dynamic module mount points.
- **`assets/css/styles.css`**: Central design system. Built with modern dark-mode glassmorphic aesthetics, fluid responsive layouts, and rich cybernetic amber transitions.
- **`js/app.js`**: Router and state engine. Mounts and transitions between sections.
- **`js/data/questions.js`**: Contains realistic 301-level preparation questions.
- **`js/modules/`**: Contains the visual sandboxes and simulator components:
  - `dashboard.js`: Tracks progress, loads `localStorage` state, renders statistics.
  - `exam.js`: Core exam engine (timer, immediate feed, score metrics).
  - `workflowLab.js`: Canvas-based interactive agent visualizer and token simulation.
  - `mcpSandbox.js`: Model Context Protocol JSON-RPC handshake simulation.
  - `cliLab.js`: Mock terminal mimicking `claude` (Claude Code CLI) shell.

## Styling & Design Guidelines

- **Theme**: Deep Cybernetic (Space-grade).
  - Background: Deep Dark Space (`#0a0b0d`)
  - Panels: Glassmorphism Glass (`rgba(16, 20, 28, 0.6)`)
  - Accent Color (Anthropic Amber): `#d97706` / `hsl(37, 95%, 45%)`
  - Success Color (Cyber Emerald): `#10b981` / `hsl(160, 84%, 39%)`
  - Primary Cyan Glow: `#06b6d4` / `hsl(189, 94%, 43%)`
- **Fonts**: Use 'Outfit' or 'Inter' from Google Fonts with standard browser fallbacks.
- **Accessibility**: Provide keyboard navigability, clear active states, and descriptive labels.
- **Clean Code**: Keep JS modular and strictly avoid global state pollution. Sync components via localStorage and explicit state callbacks.
