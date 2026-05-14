import { ApiError } from '../utils/errors.js';

const requiredBackendEnvs = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

type RequiredBackendEnv = (typeof requiredBackendEnvs)[number];

type BackendEnv = Record<RequiredBackendEnv, string>;

export const getBackendEnv = (): BackendEnv => {
  const missing = requiredBackendEnvs.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new ApiError(500, 'ENV_MISSING', 'Configuracao obrigatoria ausente', missing);
  }

  return {
    SUPABASE_URL: process.env.SUPABASE_URL as string,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
};
