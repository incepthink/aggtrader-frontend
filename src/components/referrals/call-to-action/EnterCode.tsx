"use client";

// src/components/referrals/call-to-action/EnterCode.tsx

import GenericModal from "@/components/common/ui/GenericModal";
import GlowBox from "@/components/common/ui/GlowBox";
import { ReferralResponse } from "@/hooks/useUserReferralData";
import { BACKEND_URL } from "@/utils/constants";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

type enterCodeProps = {
  data: ReferralResponse;
  referralCode: string | null;
};

const EnterCode = ({ data, referralCode }: enterCodeProps) => {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [inputCode, setInputCode] = useState(referralCode || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasReferral = data.referredBy !== null;

  useEffect(() => {
    if (referralCode) {
      setIsOpen(true);
      setInputCode(referralCode);
    }
  }, [referralCode]);

  const handleSubmit = async () => {
    if (!address || !inputCode.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await axios.post(`${BACKEND_URL}/user/referrals/add`, {
        code: inputCode.toUpperCase(),
        walletAddress: address,
      });

      // Refetch data after successful submission
      queryClient.invalidateQueries({
        queryKey: ["userReferralData", address],
      });

      // Close modal
      setIsOpen(false);
      setInputCode("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to apply referral code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!address || !data.referredBy) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await axios.delete(`${BACKEND_URL}/user/referrals`, {
        data: {
          code: data.referredBy.code,
          walletAddress: address,
        },
      });

      // Refetch data after successful removal
      queryClient.invalidateQueries({
        queryKey: ["userReferralData", address],
      });

      // Close modal
      setIsOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove referral code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-primary border-primary border-2 px-4 py-2.5 cursor-pointer hover:bg-primary/10 transition-all active:bg-primary/20 rounded-lg text-sm"
      >
        {hasReferral ? "Remove Code" : "Enter Code"}
      </button>

      <GenericModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={hasReferral ? "Remove Referral" : "Enter Code"}
      >
        <div className="space-y-4">
          {hasReferral ? (
            <>
              <p className="text-sm text-gray-400">
                Using code:{" "}
                <span className="text-teal-400 font-semibold">
                  {data.referredBy?.code}
                </span>
              </p>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                onClick={handleRemove}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Removing..." : "Remove"}
              </button>
            </>
          ) : (
            <>
              {data.referralCode === inputCode.toUpperCase() ? (
                <p className="text-sm text-red-400">
                  You cannot use your own referral code!
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Enter a users referral code to start earning rewards
                </p>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <input
                type="text"
                placeholder="Enter referral code"
                className={`w-full px-4 py-2 bg-transparent border border-teal-900/30 rounded text-gray-200`}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmit}
                disabled={
                  data.referralCode === inputCode.toUpperCase() ||
                  isSubmitting ||
                  !inputCode.trim()
                }
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded text-white cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </>
          )}
        </div>
      </GenericModal>
    </>
  );
};

export default EnterCode;
