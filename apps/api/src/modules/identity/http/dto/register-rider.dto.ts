import { z } from 'zod';

/**
 * DTO de entrada do cadastro. O Zod valida a FORMA de transporte: campos
 * presentes, tipos, tamanho minimo. A regra de DOMINIO do email (formato valido,
 * normalizacao) fica no VO Email, camada mais interna. Ha sobreposicao de
 * proposito e tudo bem — sao guardas em profundidades diferentes.
 */
export const registerRiderSchema = z.object({
  name: z.string().min(1, 'nome obrigatorio'),
  email: z.string().min(1, 'email obrigatorio'),
  password: z.string().min(8, 'senha precisa de ao menos 8 caracteres'),
});

export type RegisterRiderDto = z.infer<typeof registerRiderSchema>;
