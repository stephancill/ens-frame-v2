import { mainnetWithEns, publicClient } from "@/client";
import { calculateEnsRenewalAuto, createRelayCall, getKvKey } from "@/utils";
import { ethRegistrarControllerRenewSnippet } from "@ensdomains/ensjs/contracts";
import { getPrice } from "@ensdomains/ensjs/public";
import { kv } from "@vercel/kv";
import { TransactionTargetResponse, getFrameMessage } from "frames.js";
import { NextRequest } from "next/server";
import { makeRenewTxData } from "../../../lib/ens/makeRenewTxData";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const name = req.nextUrl.searchParams.get("name");
  const years = parseFloat(req.nextUrl.searchParams.get("years")!);
  const isAuto = req.nextUrl.searchParams.get("auto") === "true";
  const renewalId = req.nextUrl.searchParams.get("renewalId");

  if (!name) {
    throw new Error("No name");
  }

  if (!renewalId) {
    throw new Error("No renewalId");
  }

  const connectedAddress = body.untrustedData?.address;

  if (!connectedAddress) {
    throw new Error("No connected address");
  }

  const durationSeconds = 31536000 * years;

  try {
    if (isAuto) {
      const { tx, fundsChainId } = await calculateEnsRenewalAuto({
        connectedAddress: connectedAddress!,
        name,
        durationSeconds,
      });

      // Initiate cross-chain execution
      const { steps } = await createRelayCall({
        user: connectedAddress as `0x${string}`,
        txs: [
          {
            ...tx,
            value: tx.value.toString(),
          },
        ],
        originChainId: fundsChainId,
        destinationChainId: mainnetWithEns.id,
        source: "ens.steer.fun",
      });

      // Save steps to kv if it's a transaction request
      await kv.set(getKvKey(renewalId), JSON.stringify(steps));

      const relayTxData = steps[0].items?.[0].data;

      const txResponse: TransactionTargetResponse = {
        chainId: `eip155:${fundsChainId}`,
        method: "eth_sendTransaction",
        params: {
          abi: [],
          to: relayTxData.to,
          value: relayTxData.value,
          data: relayTxData.data,
        },
      };

      return Response.json(txResponse);
    } else {
      const [{ base: basePrice, premium }] = await Promise.all([
        getPrice(publicClient, {
          nameOrNames: name,
          duration: durationSeconds,
        }),
      ]);

      const value = ((basePrice + premium) * BigInt(110)) / BigInt(100); // add 10% to the price for buffer
      const tx = makeRenewTxData(publicClient, {
        nameOrNames: name,
        duration: durationSeconds,
        value,
      });

      const txResponse: TransactionTargetResponse = {
        chainId: `eip155:${mainnetWithEns.id}`,
        method: "eth_sendTransaction",
        params: {
          abi: ethRegistrarControllerRenewSnippet,
          to: tx.to,
          value: tx.value.toString(),
          data: tx.data,
        },
      };
      return Response.json(txResponse);
    }
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ message: error.message }, { status: 400 });
    }

    return Response.json(
      { message: "Failed to get renewal tx data" },
      { status: 500 }
    );
  }
}
