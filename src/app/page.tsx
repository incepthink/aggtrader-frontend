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
        <div className="text-center px-4 sm:px-8 max-w-3xl z-10">
          <h1 className="text-4xl sm:text-6xl font-semibold leading-tight">
            The Platform to Power <br />
            All <span className="text-cyan-400">Agg Trades</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-300">
            Trading is chaotic — but it doesn’t have to be.
          </p>
          <div className="mt-8">
            <a
              href="/spot"
              className="inline-block px-6 py-3 text-base font-medium text-black bg-gradient-to-r from-[#00F5E0] to-[#00FAFF] rounded-md hover:opacity-90 
    hover:shadow-[0_0_8px_rgba(0,245,224,0.6),0_0_16px_rgba(0,245,224,0.5),0_0_24px_rgba(0,245,224,0.4)]
    transition-shadow "
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
