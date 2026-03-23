/**
 * Reads JSON_KEY + JSON_VALUE from env, prints one-line JSON object for update-json.mjs.
 * Value parsing matches github-json.parseJsonValue (plain text or JSON literal).
 */

import process from 'node:process';
import { parseJsonValue } from './github-json.mjs';

const key = process.env.JSON_KEY?.trim();
if (!key) {
  console.error('JSON_KEY is required');
  process.exit(1);
}

const patch = { [key]: parseJsonValue(process.env.JSON_VALUE) };
process.stdout.write(JSON.stringify(patch));
