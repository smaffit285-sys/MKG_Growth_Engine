# SMWS Landing Site — Launch Ready

This repo is configured for the custom domain `smws.work` using the included `CNAME` file.

Pages:
- `index.html`
- `services.html`
- `packages.html`
- `process.html`
- `principles.html`
- `faq.html`
- `contact.html`
- `404.html`

Launch helpers:
- `CNAME` points to `smws.work`
- `robots.txt` points to `https://smws.work/sitemap.xml`
- `sitemap.xml` includes the public pages
- Canonical and Open Graph URLs use `https://smws.work`

Contact:
- Contact actions use `hello@smws.work`. Make sure that email address exists or forwards correctly before sending traffic.

Deploy notes:
- For GitHub Pages, publish from the repo root and point DNS to GitHub Pages.
- For Vercel, use a static/other project preset, no build command, and the repo root as the public output.
