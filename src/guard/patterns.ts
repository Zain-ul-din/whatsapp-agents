import { CountryCode, findPhoneNumbersInText } from 'libphonenumber-js/max';
import { PiiSpan } from './types';

/**
 * Deterministic detectors for structured personal data. Every match is validated
 * (checksum or phone metadata) so random digit strings are not flagged.
 * Order matters: earlier detectors win when spans overlap.
 */

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const IBAN = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,4})?\b/gi;
const CARD = /\b\d(?:[ -]?\d){12,18}\b/g;
const CNIC = /\b\d{5}-?\d{7}-?\d\b/g;
const SECRET =
  /\b(?:password|passcode|pin|otp|one[- ]time (?:password|code)|verification code)\b\s*(?:is|:|=)?\s*(\S+)/gi;

export function luhnValid(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function ibanValid(raw: string): boolean {
  const iban = raw.replace(/\s/g, '').toUpperCase();
  if (iban.length < 15 || iban.length > 34) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

function regexSpans(
  text: string,
  pattern: RegExp,
  label: string,
  accept: (match: string) => boolean = () => true,
  group = 0
): PiiSpan[] {
  const spans: PiiSpan[] = [];
  for (const m of text.matchAll(pattern)) {
    const value = m[group];
    if (!value || m.index === undefined) continue;
    if (!accept(value)) continue;
    // A capture group used here always ends the match, so its offset is measured from the end
    const start = group === 0 ? m.index : m.index + m[0].length - value.length;
    spans.push({ start, end: start + value.length, label });
  }
  return spans;
}

/** IBANs written in groups can run into the next word, so trim trailing groups until valid. */
function ibanSpans(text: string): PiiSpan[] {
  const spans: PiiSpan[] = [];
  for (const m of text.matchAll(IBAN)) {
    if (m.index === undefined) continue;
    let candidate = m[0];
    while (candidate.length >= 15 && !ibanValid(candidate)) {
      const lastSpace = candidate.lastIndexOf(' ');
      if (lastSpace < 0) break;
      candidate = candidate.slice(0, lastSpace);
    }
    if (ibanValid(candidate)) {
      spans.push({ start: m.index, end: m.index + candidate.length, label: 'IBAN' });
    }
  }
  return spans;
}

function phoneSpans(text: string, defaultCountry: CountryCode): PiiSpan[] {
  return findPhoneNumbersInText(text, { defaultCountry }).map((p) => ({
    start: p.startsAt,
    end: p.endsAt,
    label: 'PHONE'
  }));
}

/** Keeps the first span among overlapping ones (callers pass spans in priority order). */
export function mergeSpans(...groups: PiiSpan[][]): PiiSpan[] {
  const accepted: PiiSpan[] = [];
  for (const span of groups.flat()) {
    if (span.end <= span.start) continue;
    const overlaps = accepted.some((a) => span.start < a.end && a.start < span.end);
    if (!overlaps) accepted.push(span);
  }
  return accepted.sort((a, b) => a.start - b.start);
}

export function detectPatterns(text: string, defaultCountry: CountryCode = 'PK'): PiiSpan[] {
  return mergeSpans(
    regexSpans(text, SECRET, 'SECRET', () => true, 1),
    regexSpans(text, EMAIL, 'EMAIL'),
    ibanSpans(text),
    regexSpans(text, CNIC, 'CNIC'),
    regexSpans(text, CARD, 'CARD', (m) => luhnValid(m.replace(/\D/g, ''))),
    phoneSpans(text, defaultCountry)
  );
}
