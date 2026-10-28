/** Typed application configuration, loaded from environment. */
export interface AppConfig {
  nodeEnv: string
  port: number
  apiPrefix: string
  corsOrigin: string
  jwt: {
    accessSecret: string
    refreshSecret: string
    accessTtl: number
    refreshTtl: number
  }
  redis: { host: string; port: number }
  throttle: { ttl: number; limit: number }
  storage: { driver: string; dir: string }
  gatewayMode: 'mock' | 'live'
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: Number(process.env.JWT_ACCESS_TTL ?? 900),
    refreshTtl: Number(process.env.JWT_REFRESH_TTL ?? 1209600),
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL ?? 60),
    limit: Number(process.env.THROTTLE_LIMIT ?? 120),
  },
  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    dir: process.env.STORAGE_DIR ?? './storage',
  },
  gatewayMode: (process.env.GATEWAY_MODE as 'mock' | 'live') ?? 'mock',
})
