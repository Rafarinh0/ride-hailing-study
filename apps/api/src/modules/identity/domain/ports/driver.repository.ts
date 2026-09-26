import { Driver } from '../driver';
import { Email } from '../value-objects/email';

export interface DriverRepository {
  save(driver: Driver): Promise<void>;
  findByEmail(email: Email): Promise<Driver | null>;
}

export const DRIVER_REPOSITORY = Symbol('DRIVER_REPOSITORY');
