// src/components/referral/call-to-action/ViewCode.tsx

import GenericModal from "@/components/common/ui/GenericModal";
import { useState } from "react";

type viewCodeProps = {
  code: string;
};

const ViewCode = ({ code }: viewCodeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  // Replace this with your actual referral code from backend
  const referralCode = code;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied("code");
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleCopyLink = async () => {
    const link = `https://aggtrade.xyz/join/${referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied("link");
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-primary border-primary border-2 px-3 md:px-4 py-2 md:py-2.5 cursor-pointer hover:bg-primary/10 transition-all active:bg-primary/20 rounded-lg text-xs md:text-sm whitespace-nowrap"
      >
        View Code
      </button>

      <GenericModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="View Code"
        size="sm"
      >
        <div className="space-y-6">
          {/* Code Display */}
          <div className=" rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-teal-400 tracking-wider">
              {referralCode}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleCopyCode}
              className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg text-white  font-medium transition-all flex items-center justify-center gap-2"
            >
              {copied === "code" ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Code
                </>
              )}
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-3 border border-teal-900/30 hover:bg-teal-900/10 active:bg-teal-900/20 rounded-lg text-gray-300 font-medium transition-all flex items-center justify-center gap-2"
            >
              {copied === "link" ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      </GenericModal>
    </>
  );
};

export default ViewCode;
