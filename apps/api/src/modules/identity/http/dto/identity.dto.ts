import { z } from 'zod';

/**
 * DTOs de entrada. O Zod valida a FORMA de transporte (campos, tipos, tamanho);
 * a regra de DOMINIO do email fica no VO Email, camada mais interna.
 * O mesmo payload de cadastro serve para passageiro e motorista.
 */
export const registerSchema = z.object({
  name: z.string().min(1, 'nome obrigatorio'),
  email: z.string().min(1, 'email obrigatorio'),
  password: z.string().min(8, 'senha precisa de ao menos 8 caracteres'),
});
export type RegisterDto = z.infer<typeof registerSchema>;

// No login a senha so precisa existir: aplicar a politica de tamanho aqui
// travaria contas antigas se a politica mudar, e revelaria a regra a um atacante.
export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;
