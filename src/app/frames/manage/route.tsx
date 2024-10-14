import { normalise } from "@ensdomains/ensjs/utils";
import { Button } from "frames.js/next";
import { frames } from "../frames";
import { getExpiry } from "@ensdomains/ensjs/public";
import { publicClient } from "@/client";
import { formatExpiration } from "@/utils";
import { Scaffold } from "../components/Scaffold";
import { Heading } from "../components/Heading";

function getEthTld(name: string) {
  const segments = name.split(".");

  // Return last 2 segments joined by a dot
  return segments.slice(-2).join(".");
}

const handler = frames(async (ctx) => {
  let nameRaw = ctx.searchParams.name as string | undefined;

  if (ctx.message?.inputText) {
    nameRaw = ctx.message.inputText;
  }

  nameRaw = nameRaw?.trim();

  if (!nameRaw) {
    return {
      image: (
        <Scaffold>
          <div tw="flex mx-auto">
            <Heading>Invalid search input</Heading>
          </div>
        </Scaffold>
      ),
      buttons: [
        <Button action="post" target="/">
          ← Back
        </Button>,
      ] as [any],
    };
  }

  let name = getEthTld(nameRaw?.endsWith(".eth") ? nameRaw : `${nameRaw}.eth`);

  try {
    name = normalise(name);
  } catch (error) {
    return {
      image: (
        <Scaffold>
          <div tw="flex mx-auto">
            <Heading>Invalid ENS name</Heading>
          </div>
        </Scaffold>
      ),
      buttons: [
        <Button action="post" target="/">
          ← Back
        </Button>,
      ] as [any],
    };
  }

  const expiry = await getExpiry(publicClient, { name });

  if (!expiry) {
    return {
      image: (
        <Scaffold>
          <div tw="w-full h-full flex flex-col">
            <Heading>Manage ENS</Heading>
            <div tw="flex justify-center items-center my-auto flex-col">
              <div tw="flex font-bold text-[60px]">{name}</div>
              <div tw="flex text-[45px] mt-2">is available to register</div>
            </div>
          </div>
        </Scaffold>
      ),
      buttons: [
        <Button action="post" target="/">
          ← Back
        </Button>,
        <Button
          action="link"
          target={`https://app.ens.domains/${name}/register`}
        >
          Register
        </Button>,
      ] as [any, any],
    };
  }

  return {
    image: (
      <Scaffold>
        <div tw="w-full h-full flex flex-col">
          <Heading>Manage ENS</Heading>
          <div tw="my-auto flex items-center justify-center flex-col">
            <div tw="flex font-bold text-[60px]">{name}</div>
            <div tw="flex text-[45px] mt-2">
              expires in {formatExpiration(expiry.expiry.date)}
            </div>
          </div>
        </div>
      </Scaffold>
    ),
    textInput: "Years to renew (default: 1)",
    buttons: [
      <Button action="post" target={"/"}>
        ← Back
      </Button>,
      <Button
        action="post"
        target={{
          pathname: "/renew",
          query: { name },
        }}
      >
        Renew
      </Button>,
    ] as [any, any],
  };
});

export const POST = handler;
export const GET = handler;
