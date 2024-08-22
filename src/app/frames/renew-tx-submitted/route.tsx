import { Execute, paths } from "@reservoir0x/relay-sdk";
import { kv } from "@vercel/kv";
import { Button } from "frames.js/next";
import { mainnetWithEns, reservoirClient } from "@/client";
import { frames } from "../frames";
import { getKvKey } from "@/utils";
import { Scaffold } from "../components/Scaffold";
import { Heading } from "../components/Heading";

type RelayStatusResponse =
  paths["/intents/status"]["get"]["responses"]["200"]["content"]["application/json"];

function draftWarpcastMessage(text: string, embed: string): string {
  const encodedText = encodeURIComponent(text);
  const encodedEmbed = encodeURIComponent(embed);

  return `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedEmbed}`;
}

const handler = frames(async (ctx) => {
  try {
    const name = ctx.searchParams.name;
    const renewalId = ctx.searchParams.renewalId;

    if (!ctx.message) {
      throw new Error("No message");
    }

    const message = "I just renewed my ENS name using this frame!";
    const embed = "https://ens.steer.fun";
    const draftUrl = draftWarpcastMessage(message, embed);

    const isAuto = ctx.searchParams.auto === "true";

    if (!isAuto) {
      kv.set(getKvKey(renewalId), { complete: true });

      return {
        image: (
          <Scaffold>
            <div tw="flex mx-auto">
              <Heading>Transaction submitted!</Heading>
            </div>
          </Scaffold>
        ),
        buttons: [
          <Button action="post" target="/">
            ← Back
          </Button>,
          <Button
            action="link"
            target={`${mainnetWithEns.blockExplorers.default.url}/tx/${ctx.message?.transactionId}`}
          >
            View Transaction
          </Button>,
          <Button action="link" target={draftUrl}>
            Share
          </Button>,
        ],
      };
    }

    // Look up user's request in kv
    const steps = await kv.get<Execute["steps"]>(getKvKey(renewalId));

    const check = steps?.[0].items?.[0].check;

    if (!check?.endpoint) {
      console.error(
        "Could not find check endpoint on Relay",
        JSON.stringify(steps)
      );
      throw new Error("Could not find transaction on Relay");
    }

    // Call check endpoint and report progress
    const relayResponse = await fetch(
      new URL(check.endpoint, reservoirClient.baseApiUrl).toString()
    );
    if (relayResponse.status !== 200) {
      const data = await relayResponse.json();
      console.error(data);
      throw new Error(
        `Failed to execute call: ${data.message} status: ${relayResponse.status}`
      );
    }

    // Report progress
    const checkResult = (await relayResponse.json()) as RelayStatusResponse;

    console.log(JSON.stringify(checkResult));

    if (checkResult.status === "success") {
      kv.set(getKvKey(renewalId), { complete: true, ...steps });

      return {
        image: (
          <Scaffold>
            <div tw="flex mx-auto">
              <Heading>Transaction complete!</Heading>
            </div>
          </Scaffold>
        ),
        buttons: [
          <Button action="post" target="/">
            ← Back
          </Button>,

          checkResult.inTxHashes?.[0] ? (
            <Button
              action="link"
              target={`https://blockscan.com/tx/${checkResult.inTxHashes[0]}`}
            >
              L2 tx
            </Button>
          ) : null,
          checkResult.txHashes?.[0] ? (
            <Button
              action="link"
              target={`https://blockscan.com/tx/${checkResult.txHashes[0]}`}
            >
              Mainnet tx
            </Button>
          ) : null,
          <Button action="link" target={draftUrl}>
            Share
          </Button>,
        ],
      };
    } else if (
      checkResult.status === "pending" ||
      checkResult.status === "received" ||
      (checkResult.status as unknown as string) === "unknown"
    ) {
      return {
        image: (
          <Scaffold>
            <div tw="flex mx-auto p-10">
              <Heading>
                Transaction in progress...{" "}
                {checkResult.details ? `(${checkResult.details})` : ""}
              </Heading>
            </div>
          </Scaffold>
        ),
        buttons: [
          <Button action="post" target="/">
            ← Back
          </Button>,
          <Button
            action="post"
            target={{
              pathname: "/renew-tx-submitted",
              query: { name, auto: true, renewalId },
            }}
          >
            ⟲ Check again
          </Button>,
          checkResult.inTxHashes?.[0] ? (
            <Button
              action="link"
              target={`https://blockscan.com/tx/${checkResult.inTxHashes?.[0]}`}
            >
              L2 tx
            </Button>
          ) : null,
        ],
      };
    }

    return {
      image: (
        <Scaffold>
          <div tw="flex mx-auto">
            <Heading>Unknown transaction state</Heading>
          </div>
        </Scaffold>
      ),
      buttons: [
        <Button
          action="post"
          target={{
            pathname: "/renew-tx-submitted",
            query: { name, auto: true, renewalId },
          }}
        >
          ⟲ Check again
        </Button>,
      ],
    };
  } catch (error) {
    return {
      image: (
        <Scaffold>
          <div tw="flex flex-col mx-auto my-auto">
            <Heading>{"An error occurred"}</Heading>
            <div tw="flex text-[50px]">Contact @stephancill on farcaster</div>
          </div>
        </Scaffold>
      ),
      buttons: [
        <Button action="post" target="/">
          ← Back
        </Button>,
      ],
    };
  }
});

export const GET = handler;
export const POST = handler;
