import { addEnsContracts } from "@ensdomains/ensjs";
import {
  MAINNET_RELAY_API,
  TESTNET_RELAY_API,
  convertViemChainToRelayChain,
  createClient,
} from "@reservoir0x/relay-sdk";
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

export const { TESTNET_ENABLED } = process.env;

const mainnetWithRpc = {
  ...mainnet,
  network: "homestead",
  rpcUrls: {
    default: {
      http: [process.env.MAINNET_RPC_URL],
    },
  },
} as const;

export const mainnetWithEns = TESTNET_ENABLED
  ? addEnsContracts({
      ...sepolia,
      network: "sepolia",
    })
  : {
      ...addEnsContracts(mainnetWithRpc),
      subgraphs: {
        ens: {
          url: process.env.SUBGRAPH_URL,
        },
      },
    };

export const publicClient = createPublicClient({
  chain: mainnetWithEns,
  transport: http(process.env.MAINNET_RPC_URL),
});

export const reservoirClient = createClient({
  baseApiUrl: TESTNET_ENABLED ? TESTNET_RELAY_API : MAINNET_RELAY_API,
  source: "ens.steer.fun",
  chains: [
    TESTNET_ENABLED
      ? convertViemChainToRelayChain(sepolia)
      : convertViemChainToRelayChain(mainnetWithRpc),
  ],
});
