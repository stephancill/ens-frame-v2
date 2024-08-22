export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div tw="text-[60px] font-bold flex items-center">
      <img
        tw="h-[58px] mr-[20px]"
        src={`${process.env.APP_URL}/ens_mark_light.svg`}
        alt=""
      />
      {children}
    </div>
  );
}
