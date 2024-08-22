import { Execute, paths } from "@reservoir0x/relay-sdk";
import { kv } from "@vercel/kv";
import { Button } from "frames.js/next";
import { mainnetWithEns, reservoirClient } from "@/client";
import { frames } from "../frames";
import { getKvKey } from "../../../utils";
import { Scaffold } from "../components/Scaffold";
import { Heading } from "../components/Heading";

type RelayStatusResponse =
  paths["/intents/status"]["get"]["responses"]["200"]["content"]["application/json"];

function getBlockExplorerTarget({
  txHash,
  fid,
  name,
}: {
  txHash: string;
  fid: string;
  name: string;
}) {
  const searchParams = new URLSearchParams({ fid, name });
  return {
    pathname: `/block-explorer/tx/${txHash}`,
    query: { back: `/renew-tx-submitted?${searchParams.toString()}` },
  };
}

const handler = frames(async (ctx) => {
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
      <Button action="post" target={{ pathname: "/" }}>
        ← Back
      </Button>,
      <Button
        action="link"
        target={`${mainnetWithEns.blockExplorers.default.url}/tx/${ctx.message?.transactionId}`}
      >
        View Transaction
      </Button>,
    ],
  };
});

export const GET = handler;
export const POST = handler;
