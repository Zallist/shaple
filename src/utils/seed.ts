import prand from 'pure-rand';

export function numberToString(n: number): string {
  return n.toString(36).toUpperCase();
}

export function stringToNumber(s: string): number {
  return parseInt(s.toLowerCase(), 36);
}

export function seedForDate(d = new Date()): number {
  return getRandomSeed(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
}

export function getRandomSeed(d: Date = new Date()): number {
  const rng = prand.xoroshiro128plus(d.getTime());
  rng.unsafeJump?.();
  return prand.unsafeUniformIntDistribution(0, 36 ** 8 - 1, rng); // 8 characters seed
}

export function getCurrentSeed(): number {
  const hash = window?.location?.hash;

  if (hash) {
    const params = hash.substring(1).split('&');
    for (let i = 0; i < params.length; i++) {
      const param = params[i].split('=', 2);
      if (param[0] === 'seed' && param.length === 2) {
        return stringToNumber(param[1]);
      }
    }
  }

  // Fallback to the deterministic daily seed if no usable seed is present in the URL.
  return seedForDate();
}

export function saveGameState<T>(key: string, seed: number, state: T) {
  localStorage.setItem(`${key}_${seed}`, JSON.stringify(state));
}

export function loadGameState<T>(key: string, seed: number): T | null {
  const saved = localStorage.getItem(`${key}_${seed}`);
  return saved ? JSON.parse(saved) : null;
}

export function clearGameState(key: string, seed: number) {
  localStorage.removeItem(`${key}_${seed}`);
}
