import React from "react";
import GlowBox from "../ui/GlowBox";

interface Tab {
  id: string;
  label: string;
  isSupported: boolean;
}

interface EarnFormProps {
  tabs: Tab[];
  setActiveTab: (tabId: any) => void;
  activeTab: string;
  children: React.ReactNode;
}

const EarnForm = ({
  setActiveTab,
  activeTab,
  tabs,
  children,
}: EarnFormProps) => {
  const TabButton = ({ tab }: { tab: Tab }) => {
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
          data-testid={`swap-mode-button-${tab.id}`}
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
    <GlowBox
      sx={{
        height: "fit-content",
        position: { xs: "relative", lg: "sticky" },
        top: { xs: 0, lg: 100 },
        padding: { xs: 2, sm: 3 },
      }}
    >
      <div className="mb-4">
        {/* Tab Navigation */}
        <div className="flex bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm w-full justify-between">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>
      </div>
      {children}
    </GlowBox>
  );
};

export default EarnForm;
