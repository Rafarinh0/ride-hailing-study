/**
 * Erros de dominio, em categorias SEMANTICAS (nao HTTP). O dominio nunca conhece
 * status code — ele fala "isto e um conflito", "isto e invalido". Quem traduz pra
 * 400/409/... e o filtro na borda (domain-exception.filter.ts). Assim a regra de
 * negocio nao carrega dependencia de web.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    // sem isso, `error.name` viria "Error"; new.target e a subclasse concreta
    this.name = new.target.name;
  }
}

/** Entrada viola uma regra de dominio (ex.: email mal formado). */
export abstract class ValidationError extends DomainError {}

/** Choca com um estado existente (ex.: email ja cadastrado). */
export abstract class ConflictError extends DomainError {}

/** Algo esperado nao existe. */
export abstract class NotFoundError extends DomainError {}

/** Credencial/autorizacao invalida. */
export abstract class UnauthorizedError extends DomainError {}
