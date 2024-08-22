export function Scaffold({ children }: { children: React.ReactNode }) {
  return (
    <div
      tw="w-full h-full p-10 text-white flex"
      style={{
        backgroundImage:
          "linear-gradient(330.4deg, #44BCF0 4.54%, #7298F8 59.2%, #A099FF 148.85%)",
      }}
    >
      {children}
    </div>
  );
}
