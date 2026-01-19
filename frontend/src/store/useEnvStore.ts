import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EnvVariable {
  key: string;
  value: string;
}

export interface Environment {
  id: number;
  name: string;
  description: string;
  variables: string; // JSON string of EnvVariable[]
  authConfigs?: string; // JSON string of Map<String, OAuth2Config>
}

interface EnvState {
  selectedEnvId: number | null;
  activeVariables: Record<string, string>;
  setSelectedEnvId: (id: number | null, environments: Environment[]) => void;
}

export const useEnvStore = create<EnvState>()(
  persist(
    (set) => ({
      selectedEnvId: null,
      activeVariables: {},
      setSelectedEnvId: (id, environments) => {
        const env = environments.find((e) => e.id === id);
        let vars: Record<string, string> = {};
        if (env && env.variables) {
          try {
            const parsed = JSON.parse(env.variables) as EnvVariable[];
            parsed.forEach((v) => {
              if (v.key) vars[v.key] = v.value;
            });
          } catch (e) {
            console.error('Failed to parse env variables', e);
          }
        }
        set({ selectedEnvId: id, activeVariables: vars });
      },
    }),
    {
      name: 'env-storage',
    }
  )
);
