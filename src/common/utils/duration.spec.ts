import { parseDurationToSeconds } from './duration';

describe('parseDurationToSeconds', () => {
  it('parses common jwt expire formats', () => {
    expect(parseDurationToSeconds('15m')).toBe(900);
    expect(parseDurationToSeconds('7d')).toBe(604800);
    expect(parseDurationToSeconds('30s')).toBe(30);
  });

  it('rejects invalid input', () => {
    expect(() => parseDurationToSeconds('15min')).toThrow('Invalid duration');
  });
});
