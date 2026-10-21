// The text formatters against real serpgrab responses (fixtures/, copied from the API's parser tests).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formatMaps, formatWeb } from './format.mjs';

const load = (name) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

test('web: AI Overview, results and People also ask', () => {
  const text = formatWeb({ query: 'why is the sky blue', country: 'us', pages: [load('web-why-sky-blue')] });
  assert.match(text, /^Google results for "why is the sky blue" \(country: us, via serpgrab\)/);
  assert.match(text, /## AI Overview/);
  assert.match(text, /## Results\n\n1\. .+ - https?:\/\//);
  assert.match(text, /## People also ask\n\n- /);
  assert.match(text, /results from 1 of 1 page\.$/);
});

test('web: local pack and answer box', () => {
  const local = formatWeb({ query: 'pizza austin', country: 'us', pages: [load('web-pizza-austin')] });
  assert.match(local, /## Local results\n\n1\. Home Slice Pizza - Pizza restaurant, 4\.7★ \(11164 reviews\)/);
  const fx = formatWeb({ query: '100 usd to eur', country: 'us', pages: [load('web-usd-eur')] });
  assert.match(fx, /## Answer box \(currency converter\)\n\nresult: 89\.11 Euro/);
  assert.match(fx, /## Knowledge panel: Currency Conversion/);
});

test('web: results are deduplicated across pages and early stops are reported', () => {
  const page = load('web-why-sky-blue');
  const n = page.organic_results.length;
  const text = formatWeb({ query: 'q', country: 'us', pages: [page, page], requested: 3, stoppedEarly: 'Google had no more results' });
  assert.match(text, new RegExp(`${n} results from 2 of 3 pages \\(Google had no more results\\)\\.$`));
});

test('maps: places with rating, address and coordinates, numbered by page', () => {
  const data = load('maps-pizza-austin');
  const text = formatMaps({ query: 'pizza', country: 'us', data });
  assert.match(text, /1\. DeSano Pizzeria Napoletana - Downtown Austin - Pizza restaurant, 4\.7★ \(1450 reviews\)/);
  assert.match(text, /301 Lavaca St Ste 200, Austin, TX 78701/);
  assert.match(text, /30\.26632,-97\.74596 · place_id ChIJ/);
  assert.match(formatMaps({ query: 'pizza', country: 'us', data, page: 2 }), /\n21\. DeSano/);
});
