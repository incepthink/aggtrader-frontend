import Image from "next/image";

export default function Home() {
  return (
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
            href="#"
            className="inline-block px-6 py-3 text-base font-medium text-black bg-cyan-400 rounded-md hover:bg-cyan-300 transition"
          >
            Trade Now
          </a>
        </div>
      </div>

      {/* Optional overlay for better contrast */}
      <div className="absolute inset-0 bg-black opacity-60 z-0" />
    </div>
  );
}
