import { formatExpiration } from "@/utils";
import { getExpiry } from "@ensdomains/ensjs/public";
import { getNamesForAddress } from "@ensdomains/ensjs/subgraph";
import { Button } from "frames.js/core";
import { farcasterHubContext } from "frames.js/middleware";
import { publicClient } from "@/client";
import { Heading } from "../components/Heading";
import { Scaffold } from "../components/Scaffold";
import { frames } from "../frames";

export const POST = frames(
  async (ctx) => {
    if (!ctx.message) {
      throw new Error("No message");
    }

    const username = ctx.message.requesterUserData?.username;

    const walletAddress = await ctx.message.walletAddress();
    const farcasterAddresses = ctx.message.requesterVerifiedAddresses;

    const addresses = farcasterAddresses
      ? farcasterAddresses
      : walletAddress
      ? [walletAddress]
      : [];

    const ensResults = await Promise.all([
      username?.endsWith(".eth")
        ? {
            names: [
              {
                name: username,
                expiryDate: (
                  await getExpiry(publicClient, {
                    name: username,
                  })
                )?.expiry,
              },
            ],
          }
        : {},
      ...addresses.map(async (address) => ({
        address,
        names: await getNamesForAddress(publicClient, {
          address: address as `0x${string}`,
        }),
      })),
    ]);

    // Filter out and deduplicate profiles
    const ensNames = ensResults
      .map((e) => e.names)
      .flat()
      .filter((e) => Boolean(e))
      .filter((e, i, a) => a.findIndex((x) => x?.name === e?.name) === i)
      .sort(
        (a, b) =>
          (a?.expiryDate?.date.getTime() ?? 0) -
          (b?.expiryDate?.date.getTime() ?? 0)
      ) as {
      name: string;
      expiryDate: { date: Date };
    }[];

    if (ensNames.length === 0) {
      return {
        image: (
          <Scaffold>
            <div tw="flex mx-auto">
              <Heading>No addresses to check, try searching.</Heading>
            </div>
          </Scaffold>
        ),
        textInput: "Search for an ENS name",
        buttons: [
          <Button action="post" target="/">
            ← Back
          </Button>,
          <Button action="post" target="/manage">
            Search 🔎
          </Button>,
        ],
      };
    }

    return {
      image: (
        <Scaffold>
          <div tw="flex flex-col w-full h-full">
            <Heading>Your Names</Heading>
            <div tw="flex flex-col justify-center mt-[30px]">
              {ensNames.slice(0, 5).map(({ name, expiryDate }) => (
                <div key={name} tw="flex flex-row mb-[25px] text-[45px]">
                  <div tw="flex flex-row items-center" key={name}>
                    <div tw="mr-1 -ml-2 flex items-center font-bold">
                      {name}
                    </div>
                  </div>
                  {expiryDate && (
                    <div tw="flex ml-[10px]">
                      {formatExpiration(expiryDate.date)} left
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Scaffold>
      ),
      textInput: "Search for an ENS name",
      buttons: [
        <Button action="post" target="/manage">
          🔎 Search
        </Button>,
        ...ensNames.slice(0, 3).map((e) => (
          <Button
            action="post"
            target={{ pathname: "/manage", query: { name: e.name } }}
          >
            {e.name.slice(0, 100)}
          </Button>
        )),
      ],
    };
  },
  {
    middleware: [farcasterHubContext({ hubHttpUrl: process.env.HUB_HTTP_URL })],
  }
);
