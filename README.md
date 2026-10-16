# reinersbot.space

The website for **Reiner**, an all-in-one Discord bot for League of Legends communities: custom lobbies with MMR, Imposter and a live League quiz, AI chat, points and ranks, focus timers, moderation, and a web dashboard.

**Live:** https://reinersbot.space

| Page | Path |
|---|---|
| Home: hero, 3D live preview, setup guide, FAQ, contact | `landing/index.html` |
| Features | `landing/features/` |
| Docs (with a live quiz on the bot's public API) | `landing/docs/` |
| Privacy and terms | `landing/privacy/`, `landing/terms/` |

## How it's built

Plain HTML, CSS and JavaScript. There's no framework and no bundler, and the files are served exactly as they are.

- `landing/css/tokens.css` holds the theme. `site.css` is the shared shell for every page; `discord.css` holds the Discord-style product mocks.
- The header and footer are partials. Edit `scripts/landing-partials/*.html`, then run:
  ```bash
  python scripts/landing-partials/apply.py
  ```
- The privacy and terms pages are generated from `PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md`:
  ```bash
  bash scripts/legal-pages/build.sh
  ```
- Page transitions use cross-document View Transitions, with a fade fallback. Motion respects `prefers-reduced-motion`.

## Run locally

```bash
python -m http.server 5178 --directory landing
```

Then open http://localhost:5178. The live quiz and contact form call `/api/*` on the bot, so they only work in production.

## Deploy

`deploy/deploy-landing.sh` uploads `landing/` to the server's web root over SSH. It leaves the dashboard build alone and adds content-hash `?v=` stamps to CSS and JS links so they can be cached for good. `deploy/nginx-reinersbot.conf` is the live nginx config: TLS, security headers, CSP, caching, a 404 page and redirects. `deploy/indexnow.sh` notifies search engines after a deploy.

## Contact

yousseftimoumi@reinersbot.space · built by [Youssef “Reiner” Timoumi](https://github.com/youssef1timoumi)
