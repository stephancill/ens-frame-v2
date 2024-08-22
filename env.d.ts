declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_URL: string;
      SUBGRAPH_URL: string;
    }
  }
}

export {};
