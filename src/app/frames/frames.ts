import { createFrames } from "frames.js/next";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export const frames = createFrames({
  baseUrl: process.env.APP_URL,
  basePath: "/frames",
  async imageRenderingOptions() {
    const [regularFont, boldFont] = await Promise.all([
      fs.readFile(
        path.join(path.resolve(process.cwd(), "public"), "Satoshi-Regular.ttf")
      ),
      fs.readFile(
        path.join(path.resolve(process.cwd(), "public"), "Satoshi-Bold.ttf")
      ),
    ]);

    return {
      imageOptions: {
        fonts: [
          {
            name: "Satoshi",
            data: regularFont,
            weight: 400,
          },
          {
            name: "Satoshi",
            data: boldFont,
            weight: 700,
          },
        ],
      },
    };
  },
});