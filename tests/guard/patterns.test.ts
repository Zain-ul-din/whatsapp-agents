import { describe, expect, it } from 'vitest';
import { detectPatterns, ibanValid, luhnValid } from '../../src/guard/patterns';

const found = (text: string) =>
  detectPatterns(text).map((s) => ({ label: s.label, value: text.slice(s.start, s.end) }));

describe('detectPatterns', () => {
  it.each([
    ['call me on 0300 1234567', 'PHONE', '0300 1234567'],
    ['my number is +92 300 1234567', 'PHONE', '+92 300 1234567'],
    ['UK office: +44 20 7946 0958', 'PHONE', '+44 20 7946 0958'],
    ['mail me at ali.khan@example.com', 'EMAIL', 'ali.khan@example.com'],
    ['CNIC 35202-1234567-1 hai', 'CNIC', '35202-1234567-1'],
    ['card 4111 1111 1111 1111 exp 12/28', 'CARD', '4111 1111 1111 1111'],
    ['IBAN GB82 WEST 1234 5698 7654 32 please', 'IBAN', 'GB82 WEST 1234 5698 7654 32'],
    ['my password is hunter2', 'SECRET', 'hunter2'],
    ['OTP: 482913', 'SECRET', '482913']
  ])('finds %s', (text, label, value) => {
    expect(found(text)).toContainEqual({ label, value });
  });

  it.each([
    'we sell 25000 bags a month',
    'order 4111 1111 1111 1112 is late',
    'invoice GB82 WEST 1234 5698 7654 33',
    'Acme Rice Mills, Lahore'
  ])('ignores %s', (text) => {
    expect(found(text)).toEqual([]);
  });
});

describe('validators', () => {
  it('checks card checksums', () => {
    expect(luhnValid('4111111111111111')).toBe(true);
    expect(luhnValid('4111111111111112')).toBe(false);
  });

  it('checks IBAN checksums', () => {
    expect(ibanValid('GB82WEST12345698765432')).toBe(true);
    expect(ibanValid('GB82WEST12345698765433')).toBe(false);
  });
});
