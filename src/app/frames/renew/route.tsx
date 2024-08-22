import { getPrice } from "@ensdomains/ensjs/public";
import { Button } from "frames.js/next";
import { formatEther } from "viem";
import { base, baseSepolia } from "viem/chains";
import { frames } from "../frames";
import { createRelayCall, getEthUsdPrice, numberWithCommas } from "@/utils";
import { mainnetWithEns, publicClient, TESTNET_ENABLED } from "@/client";
import { makeRenewTxData } from "@/lib/ens/makeRenewTxData";
import { Scaffold } from "../components/Scaffold";
import { Heading } from "../components/Heading";
import { randomUUID } from "crypto";

function formatEtherDisplay(eth: bigint) {
  return parseFloat(formatEther(eth)).toPrecision(4);
}

function formatUsdDisplay(usd: number) {
  return numberWithCommas(
    // People don't care about cents when it's over $100
    usd > 100 ? usd.toPrecision(3) : usd.toFixed(2)
  );
}

export const POST = frames(async (ctx) => {
  const name = ctx.searchParams["name"];

  if (!name) {
    throw new Error("No name");
  }

  if (!ctx.message) {
    throw new Error("No message");
  }

  let yearsInput = 1;

  if (ctx.message.inputText) {
    yearsInput = parseFloat(ctx.message.inputText);
  }

  const duration = 31536000 * yearsInput;

  const [renewPrice, renewTxData, ethUsdPrice] = await Promise.all([
    getPrice(publicClient, {
      nameOrNames: name,
      duration,
    }),
    makeRenewTxData(publicClient, {
      nameOrNames: name,
      duration,
      value: BigInt(0), // Dummy value
    }),
    getEthUsdPrice(),
  ]);

  const { base: basePrice, premium } = renewPrice;

  const renewalEth = ((basePrice + premium) * BigInt(110)) / BigInt(100); // add 10% to the price for buffer
  const renewalUsd = ethUsdPrice * parseFloat(formatEther(renewalEth));

  const renewalEtherFormatted = formatEtherDisplay(renewalEth);
  const renewalUsdFormatted = formatUsdDisplay(renewalUsd);

  // Initiate cross-chain execution
  const { steps } = await createRelayCall({
    /**
     * An address that would never fail (WETH)
     * since we don't have access to the user's connected address
     */
    user: TESTNET_ENABLED
      ? // https://sepolia.etherscan.io/accounts
        "0x4200000000000000000000000000000000000016"
      : "0x4200000000000000000000000000000000000006",
    txs: [
      {
        ...renewTxData,
        value: renewalEth.toString(),
      },
    ],
    originChainId: TESTNET_ENABLED ? baseSepolia.id : base.id,
    destinationChainId: mainnetWithEns.id,
    source: "ens.steer.fun",
  });
  const relayTxData = steps[0].items?.[0].data;

  const totalFeesEther = BigInt(relayTxData.value) - renewalEth;
  const totalFeesUsd = ethUsdPrice * parseFloat(formatEther(totalFeesEther));

  const totalFeesEtherFormatted = formatEtherDisplay(totalFeesEther);
  const totalFeesUsdFormatted = formatUsdDisplay(totalFeesUsd);

  const totalEther = BigInt(relayTxData.value);
  const totalUsd = ethUsdPrice * parseFloat(formatEther(totalEther));

  const totalEtherFormatted = formatEtherDisplay(totalEther);
  const totalUsdFormatted = formatUsdDisplay(totalUsd);

  const renewalId = randomUUID();

  return {
    image: (
      <Scaffold>
        <div tw="flex flex-col w-full h-full pb-[20px]">
          <Heading>Renew</Heading>
          <div tw="flex my-[110px] items-center">
            <div tw="flex w-1/2 flex-col">
              <div tw="flex justify-center flex-col pr-5">
                <div
                  tw="flex font-bold text-[60px]"
                  style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                >
                  {name}
                </div>
                <div tw="flex text-[45px] mt-2">
                  Renewing for {yearsInput} year{yearsInput > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div tw="flex flex-col text-[40px] p-5">
              <div tw="flex flex-row">
                <div tw="flex flex-col mt-4 mr-4">
                  <div tw="flex">Renewal</div>
                  <div tw="flex">Fees*</div>
                  <div tw="flex font-bold">Total</div>
                </div>
                <div tw="flex flex-col mt-4">
                  <div tw="flex">
                    Ξ{renewalEtherFormatted} (${renewalUsdFormatted})
                  </div>
                  <div tw="flex">
                    Ξ{totalFeesEtherFormatted} (${totalFeesUsdFormatted})
                  </div>
                  <div tw="flex font-bold">
                    Ξ{totalEtherFormatted} (${totalUsdFormatted})
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div tw="text-[35px] flex">
            *Approximate fees for execution from Base via relay.link. Chain is
            selected based on your connected address' highest balance.
          </div>
        </div>
      </Scaffold>
    ),
    buttons: [
      <Button action="post" target={{ pathname: "/manage", query: { name } }}>
        ← Back
      </Button>,
      <Button
        action="tx"
        target={{
          pathname: "/renew-tx",
          query: { name, years: yearsInput, renewalId },
        }}
        post_url={{
          pathname: "/renew-tx-submitted",
          query: { name, renewalId },
        }}
      >
        Pay on Mainnet
      </Button>,
      <Button
        action="tx"
        target={{
          pathname: "/renew-tx",
          query: { name, years: yearsInput, auto: true, renewalId },
        }}
        post_url={{
          pathname: "/renew-tx-submitted",
          query: { name, auto: true, renewalId },
        }}
      >
        Pay on L2
      </Button>,
    ],
  };
});
