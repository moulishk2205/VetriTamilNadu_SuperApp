/** Typed application configuration, loaded from environment. */
export interface AppConfig {
  nodeEnv: string
  port: number
  apiPrefix: string
  corsOrigin: string
  jwt: {
    accessSecret: string
    accessTtl: number
    refreshTtl: number
  }
  auth: {
    /** Demo auth: fixed OTP 123456, unknown identifiers resolve to the demo
     *  citizen, and POST /auth/demo issues persona sessions. Never in production
     *  unless AUTH_MOCK=true is set explicitly. */
    mock: boolean
  }
  /** Swagger UI at /<prefix>/docs. Off in production unless SWAGGER=true. */
  swagger: boolean
  redis: { host: string; port: number }
  throttle: { ttl: number; limit: number }
  storage: { driver: string; dir: string }
  gatewayMode: 'mock' | 'live'
}

/** Secrets have no fallback: a missing or short secret stops the boot. */
function requireSecret(name: string): string {
  const value = process.env[name]
  if (!value || value.length < 32) {
    throw new Error(`${name} must be set to a random value of at least 32 characters`)
  }
  return value
}

function flag(name: string): boolean | undefined {
  const value = process.env[name]?.trim().toLowerCase()
  if (value === undefined || value === '') return undefined
  return value === 'true' || value === '1'
}

export default (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 4000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    jwt: {
      accessSecret: requireSecret('JWT_ACCESS_SECRET'),
      accessTtl: Number(process.env.JWT_ACCESS_TTL ?? 900),
      refreshTtl: Number(process.env.JWT_REFRESH_TTL ?? 1209600),
    },
    auth: {
      mock: flag('AUTH_MOCK') ?? nodeEnv !== 'production',
    },
    swagger: flag('SWAGGER') ?? nodeEnv !== 'production',
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
  }
}
