/** Gera numeros em [0, 1). Mesma interface do Math.random, para poder trocar um pelo outro. */
export type Rng = () => number;

/**
 * Gerador com semente (mulberry32): a mesma semente da sempre a mesma sequencia.
 * E o que deixa duas rodadas do simulador identicas, e os testes deterministicos.
 */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UUID v4 a partir do gerador: com semente, os ids dos motoristas se repetem entre rodadas. */
export function uuidFrom(rng: Rng): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(rng() * 16).toString(16));
  hex[12] = '4'; // versao 4
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16); // variante RFC 4122
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
