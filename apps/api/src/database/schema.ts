// Registro central de schemas Drizzle, lido pelo drizzle-kit e pelo cliente.
// Cada modulo expoe seu proprio pgSchema (namespace no Postgres unico).
export * from '../modules/identity/infrastructure/schema';
export * from '../modules/trip/infrastructure/schema';
export * from '../modules/payment/infrastructure/schema';
