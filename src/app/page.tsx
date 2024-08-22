import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";
import { Frame } from "../components/Frame";

const frameUrl = `${process.env.APP_URL}/frames`;

export async function generateMetadata(): Promise<Metadata> {
  const frameMetadata = await fetchMetadata(frameUrl);

  return {
    title: "Manage ENS Name by @stephancill",
    other: frameMetadata,
  };
}

export default async function Home() {
  const metadata = await generateMetadata();
  return <Frame metadata={metadata} url={frameUrl} />;
}
