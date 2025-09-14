"use client";

import React, { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

// Icons
const SwapIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
  </svg>
);

const LimitIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" />
  </svg>
);

const DCAIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z" />
  </svg>
);

export const SwapModeButtons = ({ setActiveTab, activeTab }: any) => {
  const router = useRouter();
  const pathname = usePathname();

  const swapTabs = useMemo(
    () => [
      {
        id: "swap",
        label: "Instant",
        icon: <SwapIcon />,
        description: "Trade tokens instantly at market prices",
        path: "/swap",
        isSupported: true,
      },
      {
        id: "limit",
        label: "Trigger",
        icon: <LimitIcon />,
        description: "Set custom prices for your trades",
        path: "/limit",
        isSupported: true,
      },
      // {
      //   id: "dca",
      //   label: "DCA",
      //   icon: <DCAIcon />,
      //   description: "Dollar-cost average into your favorite tokens",
      //   path: "/dca",
      //   isSupported: false, // Disable for now
      // },
    ],
    []
  );

  // Determine active tab based on current pathname
  // const activeTab = useMemo(() => {
  //   const currentPath = pathname.split("/").pop();
  //   return (
  //     swapTabs.find((tab) => tab.path.includes(currentPath || ""))?.id || "swap"
  //   );
  // }, [pathname, swapTabs]);

  const TabButton = ({ tab }: { tab: (typeof swapTabs)[0] }) => {
    const isActive = activeTab === tab.id;

    if (!tab.isSupported) {
      return (
        <div className="flex-1">
          <div
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-medium text-gray-600 cursor-not-allowed opacity-50"
            title="Not supported yet"
          >
            <span>{tab.label}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1">
        <button
          onClick={() => setActiveTab(tab.id)}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-[#00F5E0] text-black shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          <span>{tab.label}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="mb-4">
      {/* Tab Navigation */}
      <div className="flex bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm w-full justify-between">
        {swapTabs.map((tab) => (
          <TabButton key={tab.id} tab={tab} />
        ))}
      </div>
    </div>
  );
};
