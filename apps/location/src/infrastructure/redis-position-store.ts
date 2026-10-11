import Redis from 'ioredis';
import { InvalidPositionError } from '../domain/errors';
import { DriverPosition, NearbyDriver, Position } from '../domain/position';
import { PositionStore } from '../ports/position-store';

// As chaves compartilham o trecho entre chaves ({drivers}): num Redis Cluster isso
// garante que as duas fiquem no mesmo no, condicao para um script usar as duas.
const GEO_KEY = '{drivers}:geo';
const RECORDED_AT_KEY = '{drivers}:recorded_at';

/**
 * O Redis GEO guarda pontos com a projecao do Google Maps (Web Mercator), que nao
 * chega aos polos. O dominio aceita +-90; este store aceita menos e diz isso em vez
 * de estourar um erro generico do Redis.
 */
export const REDIS_MAX_LAT = 85.05112878;

/**
 * Le a hora guardada, compara e grava: tudo dentro do Redis, que executa um script
 * por vez, sem nenhum outro comando no meio. E o "confere e grava de uma vez" do
 * ON CONFLICT ... WHERE do Postgres. Devolve 1 se gravou, 0 se a leitura era velha.
 */
const SAVE_IF_NEWER = `
local current = redis.call('HGET', KEYS[2], ARGV[1])
if current and tonumber(current) >= tonumber(ARGV[4]) then
  return 0
end
redis.call('GEOADD', KEYS[1], ARGV[3], ARGV[2], ARGV[1])
redis.call('HSET', KEYS[2], ARGV[1], ARGV[4])
return 1
`;

type RedisWithScript = Redis & {
  saveIfNewer(geoKey: string, timeKey: string, id: string, lat: number, lng: number, at: number): Promise<number>;
};

export class RedisPositionStore implements PositionStore {
  private readonly redis: RedisWithScript;

  constructor(redis: Redis) {
    // defineCommand manda o script uma vez e depois chama so pelo hash dele (EVALSHA).
    redis.defineCommand('saveIfNewer', { numberOfKeys: 2, lua: SAVE_IF_NEWER });
    this.redis = redis as RedisWithScript;
  }

  async save(reading: DriverPosition): Promise<boolean> {
    const { lat, lng } = reading.position;
    assertSupported(lat);
    const written = await this.redis.saveIfNewer(
      GEO_KEY,
      RECORDED_AT_KEY,
      reading.driverId,
      lat,
      lng,
      reading.recordedAt.getTime(),
    );
    return written === 1;
  }

  async find(driverId: string): Promise<DriverPosition | null> {
    const [positions, recordedAt] = await Promise.all([
      this.redis.geopos(GEO_KEY, driverId),
      this.redis.hget(RECORDED_AT_KEY, driverId),
    ]);
    const point = positions[0];
    if (!point || recordedAt === null) {
      return null;
    }
    // O GEO devolve [longitude, latitude], ja arredondados pela codificacao (geohash).
    return {
      driverId,
      position: Position.create(Number(point[1]), Number(point[0])),
      recordedAt: new Date(Number(recordedAt)),
    };
  }

  /**
   * GEOSEARCH percorre as celulas de geohash que cobrem o circulo, ja devolve a
   * distancia (haversine) e ordena. A hora de cada leitura vem do hash, num segundo
   * comando: sem atomicidade, mas e so leitura.
   */
  async findNearby(center: Position, radiusMeters: number, limit: number): Promise<NearbyDriver[]> {
    assertSupported(center.lat);
    const found = (await this.redis.call(
      'GEOSEARCH', GEO_KEY, 'FROMLONLAT', center.lng, center.lat,
      'BYRADIUS', radiusMeters, 'm', 'ASC', 'COUNT', limit, 'WITHDIST', 'WITHCOORD',
    )) as [string, string, [string, string]][];
    if (found.length === 0) {
      return [];
    }

    const times = await this.redis.hmget(RECORDED_AT_KEY, ...found.map(([id]) => id));
    return found.map(([id, distance, [lng, lat]], i) => ({
      driverId: id,
      position: Position.create(Number(lat), Number(lng)),
      recordedAt: new Date(Number(times[i])),
      distanceMeters: Number(distance),
    }));
  }
}

function assertSupported(lat: number): void {
  if (Math.abs(lat) > REDIS_MAX_LAT) {
    throw new InvalidPositionError(`latitude fora da area suportada (+-${REDIS_MAX_LAT}): ${lat}`);
  }
}
