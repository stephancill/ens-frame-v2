import { button } from "frames.js/core";
import { frames } from "./frames";
import { Scaffold } from "./components/Scaffold";

const handler = frames(async (ctx) => {
  return {
    image: (
      <Scaffold>
        <div tw="w-full flex flex-col justify-center items-center">
          <img
            tw="h-[100px]"
            src={`${process.env.APP_URL}/ens_logo_light.svg`}
          />
          <div tw="text-[60px] mt-[20px] font-bold">Name Manager</div>
          <div tw="absolute bottom-10">by @stephancill</div>
        </div>
      </Scaffold>
    ),
    textInput: "Search for an ENS name",
    buttons: [
      button({
        action: "post",
        target: "/manage",
        label: "🔎 Search",
      }),
      button({
        action: "post",
        target: "/check-names",
        label: "My Names",
      }),
    ],
  };
});

export const GET = handler;
export const POST = handler;
