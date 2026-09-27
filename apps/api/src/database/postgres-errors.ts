/**
 * 23505 = unique_violation no Postgres. Confere tambem `cause` porque versoes
 * novas do Drizzle embrulham o erro do driver em vez de repassa-lo direto.
 */
export function isUniqueViolation(error: unknown): boolean {
  const codeOf = (e: unknown) => (typeof e === 'object' && e !== null ? (e as { code?: unknown }).code : undefined);
  return codeOf(error) === '23505' || codeOf((error as { cause?: unknown })?.cause) === '23505';
}
