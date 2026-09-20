# Myco website

Current website version: light-only, graphite/teal palette, approved horizontal Myco logo, and text-led hero. The remaining diagrams and animations preserve the original frontend behavior.

## Preview locally

Run `python3 serve.py`, then open `http://127.0.0.1:8766`.

## Files

- `index.html`: website entry point.
- `static/js/main.js`: executable frontend bundle.
- `static/css/main.css`: base stylesheet.
- `static/css/brand.css`: current brand and layout overrides.
- `assets/`: logo and favicon assets, plus existing repository assets.
- `source/`: recovered React components and authored styles for future development. The original build configuration was not available, so this directory is not a complete rebuild environment. The static bundle is the served version.
- `serve.py`: local preview server.

## Current limitations

The contact form is not connected to lead delivery. The local server returns a clear error without forwarding or storing submissions. Static hosting also needs a real form backend before accepting requests.

Geist loads from Google Fonts. Geon uses locally installed font files if available, otherwise headings fall back to Geist. Licensed Geon web fonts are still needed.

This is a frontend preview and retains the original illustrative findings, metrics, and security copy. Verify those statements and replace mock data before public launch.

The old standalone security.html redirects into the page security section. No external hosting or deployment is configured by this update.
