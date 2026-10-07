# BNHCA website

Static website for Berkeley Neighbors for Housing and Climate Action, hosted on GitHub Pages. Edit the HTML pages and `css/style.css` directly; no production build is required.

## Local preview and checks

Use Node.js 22 or later and Google Chrome:

```sh
npm ci
node scripts/serve.mjs
```

Open http://127.0.0.1:4173. Stop the preview before running `npm test`, which starts its own server.

`npm test` runs desktop and mobile browser checks on all four pages: page script errors, local links and questionnaire files, keyboard skip links, menu controls and Escape behavior, reduced motion, horizontal overflow, and automated WCAG accessibility checks. Third-party embeds are blocked during these tests, so their current service availability is not verified. Screenshots are saved in the ignored `test-results/` folder. GitHub Actions runs the same checks using Playwright Chromium.

## Dependencies and vendored assets

Only development dependencies are installed in `node_modules/`, which is ignored. Commit `package.json` and `package-lock.json` together.

Bootstrap 5.3.8 is served locally from `vendor/bootstrap/`. To update it:

```sh
npm install --save-dev --save-exact bootstrap@VERSION
npm run vendor
npm test
```

Commit the updated package files and vendor assets. The vendor script copies official CSS, the JavaScript bundle, source maps, and license. It removes obsolete Bootstrap and jQuery bundles. The site uses native browser scrolling and Bootstrap's native JavaScript API; jQuery is no longer required.

Font Awesome 4 remains local for the existing decorative icons. Google Fonts requests are consolidated into one request for the three font families actually used. The news page embeds the Mailchimp newsletter archive, with a loading state, a slow-loading message after 12 seconds, and a direct archive link. Because the frame is cross-origin, its load event cannot confirm that Mailchimp returned usable content; the direct link remains available.

## Endorsements and questionnaires

Edit `endorsements.html`. Add questionnaire PDFs under the corresponding year/election folder and link every available response, including candidates BNHCA does not endorse. Use `%20` for spaces in link filenames. Keep older election sections and existing public questionnaire paths available.
