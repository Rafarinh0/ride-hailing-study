type PgError = { code?: unknown; constraint_name?: unknown };

/**
 * 23505 = unique_violation no Postgres, restrito a UMA constraint: sem isso, uma
 * colisao de id ou outra coluna unica seria reportada como a errada.
 * Confere tambem `cause` porque versoes novas do Drizzle embrulham o erro do driver.
 */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  return [error, (error as { cause?: unknown } | null)?.cause].some(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      (e as PgError).code === '23505' &&
      (e as PgError).constraint_name === constraint,
  );
}
