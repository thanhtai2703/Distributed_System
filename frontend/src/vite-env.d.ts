/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
interface Window {
  ENV: {
    API_URL: string;
    TODO_API_URL: string;
    USER_API_URL: string;
    STATS_API_URL: string;
  };
}
