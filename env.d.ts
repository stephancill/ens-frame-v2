declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_URL: string;
      SUBGRAPH_URL: string;
      MAINNET_RPC_URL: string;
    }
  }
}

export {};
