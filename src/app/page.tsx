import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video
          className="w-full h-full object-cover"
          src="/assets/home.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {/* <img
          src="/ellipse-home.png"
          className="w-full h-full object-cover"
          alt=""
        /> */}
      </div>
      <div className="absolute top-0 h-screen w-full flex items-center justify-center bg-transparent text-white">
        <div className="text-center px-4 sm:px-8 max-w-4xl z-10">
          <h1 className="text-4xl sm:text-4xl md:text-5xl font-semibold leading-tight">
            The Hub for all DeFi activity on
            <br />
            <span className="text-cyan-400 text-4xl md:text-6xl">Katana</span>
          </h1>
          <div className="mt-4">
            <a
              href="/spot/swap"
              className="inline-block px-6 py-3 sm:text-xl text-base font-medium text-black bg-gradient-to-r from-[#00F5E0] to-[#00FAFF] rounded-md 
   hover:ring-2 hover:ring-[#00F5E0] hover:ring-offset-2 hover:ring-offset-gray-900
   hover:shadow-[0_0_4px_rgba(0,245,224,0.8),0_0_8px_rgba(0,245,224,0.7),0_0_12px_rgba(0,245,224,0.6),0_0_18px_rgba(0,245,224,0.5),0_0_24px_rgba(0,245,224,0.4)]
   transition-all duration-300"
            >
              Trade Now
            </a>
          </div>
        </div>

        {/* Optional overlay for better contrast */}
        <div className="absolute inset-0 bg-black opacity-60 z-0" />
      </div>
    </>
  );
}
