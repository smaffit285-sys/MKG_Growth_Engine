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
- Vercel project slug: `smws-website`
- Vercel account slug: `smaffit285-sys`
- Static deployment: no build command, repo root output.
- Last deployment-prep marker: 2026-06-14.
