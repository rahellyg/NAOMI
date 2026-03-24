/**
 * Validate naomi-availability.json shape (same expectations as index.html booking).
 * Usage: node tools/validate-availability.mjs [path]
 * Default path: naomi-availability.json in repo root (run from project root).
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const filepath = process.argv[2] || join(root, 'naomi-availability.json');

let raw;
try {
  raw = readFileSync(filepath, 'utf8');
} catch (e) {
  console.error('Cannot read file:', filepath, e.message);
  process.exit(1);
}

let j;
try {
  j = JSON.parse(raw);
} catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(1);
}

const errors = [];

if (j == null || typeof j !== 'object') errors.push('Root must be an object');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

if (typeof j.version !== 'number') errors.push('version must be a number');
if (j.availabilityBySelectedDatesOnly != null && typeof j.availabilityBySelectedDatesOnly !== 'boolean')
  errors.push('availabilityBySelectedDatesOnly must be boolean if present');
if (j.bookingsSuspended != null && typeof j.bookingsSuspended !== 'boolean')
  errors.push('bookingsSuspended must be boolean if present');
if (!Array.isArray(j.daysOpen)) errors.push('daysOpen must be an array');
else if (j.daysOpen.length && !j.daysOpen.every((d) => d >= 0 && d <= 6 && Number.isInteger(d)))
  errors.push('daysOpen entries must be integers 0–6');

if (!Array.isArray(j.blockedDates)) errors.push('blockedDates must be an array');
else {
  for (const s of j.blockedDates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s).trim())) {
      errors.push(`blockedDates: invalid date "${s}" (use YYYY-MM-DD)`);
      break;
    }
  }
}

if (!Array.isArray(j.onlyOpenDates)) errors.push('onlyOpenDates must be an array (can be empty)');

if (j.hoursByDay != null) {
  if (typeof j.hoursByDay !== 'object' || Array.isArray(j.hoursByDay)) {
    errors.push('hoursByDay must be an object (day index string -> window or { closed: true })');
  } else {
    for (const [dk, ent] of Object.entries(j.hoursByDay)) {
      if (!/^[0-6]$/.test(String(dk))) {
        errors.push(`hoursByDay: invalid day key "${dk}" (use "0"–"6", 0=Sunday)`);
        break;
      }
      if (ent == null || typeof ent !== 'object') {
        errors.push(`hoursByDay[${dk}] must be an object`);
        break;
      }
      if (ent.closed === true) continue;
      if (Array.isArray(ent.windows) && ent.windows.length) {
        for (let wi = 0; wi < ent.windows.length; wi++) {
          const w = ent.windows[wi];
          if (w == null || typeof w !== 'object') {
            errors.push(`hoursByDay[${dk}].windows[${wi}] must be an object`);
            break;
          }
          for (const k of ['startHour', 'startMinute', 'endHour', 'endMinute']) {
            if (w[k] != null && typeof w[k] !== 'number') {
              errors.push(`hoursByDay[${dk}].windows[${wi}].${k} must be a number if present`);
              break;
            }
          }
        }
      } else {
        for (const k of ['startHour', 'startMinute', 'endHour', 'endMinute']) {
          if (ent[k] != null && typeof ent[k] !== 'number') {
            errors.push(`hoursByDay[${dk}].${k} must be a number if present`);
            break;
          }
        }
      }
    }
  }
}

if (j.hoursByDate != null) {
  if (typeof j.hoursByDate !== 'object' || Array.isArray(j.hoursByDate)) {
    errors.push('hoursByDate must be an object (date YYYY-MM-DD -> windows or { closed: true })');
  } else {
    for (const [dk, ent] of Object.entries(j.hoursByDate)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dk).trim())) {
        errors.push(`hoursByDate: invalid date key "${dk}"`);
        break;
      }
      if (ent == null || typeof ent !== 'object') {
        errors.push(`hoursByDate[${dk}] must be an object`);
        break;
      }
      if (ent.closed === true) continue;
      if (Array.isArray(ent.windows) && ent.windows.length) {
        for (let wi = 0; wi < ent.windows.length; wi++) {
          const w = ent.windows[wi];
          if (w == null || typeof w !== 'object') {
            errors.push(`hoursByDate[${dk}].windows[${wi}] must be an object`);
            break;
          }
          for (const k of ['startHour', 'startMinute', 'endHour', 'endMinute']) {
            if (w[k] != null && typeof w[k] !== 'number') {
              errors.push(`hoursByDate[${dk}].windows[${wi}].${k} must be a number if present`);
              break;
            }
          }
        }
      } else {
        for (const k of ['startHour', 'startMinute', 'endHour', 'endMinute']) {
          if (ent[k] != null && typeof ent[k] !== 'number') {
            errors.push(`hoursByDate[${dk}].${k} must be a number if present`);
            break;
          }
        }
      }
    }
  }
}

const nums = [
  ['startHour', j.startHour],
  ['startMinute', j.startMinute],
  ['endHour', j.endHour],
  ['endMinute', j.endMinute],
  ['slotMinutes', j.slotMinutes],
  ['meetingDurationMinutes', j.meetingDurationMinutes]
];
for (const [name, v] of nums) {
  if (v != null && typeof v !== 'number') errors.push(`${name} must be a number if present`);
}

const openStart = (j.startHour ?? 9) * 60 + (j.startMinute ?? 0);
let openEnd = (j.endHour ?? 18) * 60 + (j.endMinute ?? 0);
if (j.endHour === 24 && (j.endMinute == null || j.endMinute === 0)) openEnd = 24 * 60;
if (openStart >= openEnd) errors.push('Time window: start must be before end');

if (errors.length) {
  console.error('Validation failed:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}

console.log('OK:', filepath);
console.log(
  '  selectedOnly:',
  !!j.availabilityBySelectedDatesOnly,
  'bookingsSuspended:',
  !!j.bookingsSuspended,
  'daysOpen:',
  j.daysOpen?.length ?? 0,
  'blocked:',
  j.blockedDates?.length ?? 0,
  'onlyOpen:',
  j.onlyOpenDates?.length ?? 0,
  'slot:',
  j.slotMinutes,
  'meet:',
  j.meetingDurationMinutes,
  'hoursByDay keys:',
  j.hoursByDay && typeof j.hoursByDay === 'object' ? Object.keys(j.hoursByDay).length : 0
);
