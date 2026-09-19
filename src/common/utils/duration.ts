const UNIT_SECONDS: Record<string, number> = {
  ms: 1 / 1000,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

export function parseDurationToSeconds(input: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration: ${input}`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  return Math.ceil(value * UNIT_SECONDS[unit]);
}

export function toJwtExpiresIn(
  input: string,
): `${number}${'ms' | 's' | 'm' | 'h' | 'd'}` {
  parseDurationToSeconds(input);
  return input as `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`;
}
