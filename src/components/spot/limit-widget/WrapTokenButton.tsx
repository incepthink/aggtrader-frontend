// components/WrapTokenButton.tsx

"use client";

import React from "react";
import { useWrapNative } from "@/hooks/useWrapNative";
import type { Token } from "@/store/limit-order/utils/token.types";
import {
  isNativeToken,
  createWrappedNativeToken,
} from "@/store/limit-order/utils/token.types";
import { useNotify } from "@/components/common/NotificationProvider";

interface WrapTokenButtonProps {
  token?: Token;
  amount?: string;
  onWrapSuccess?: (wrappedToken: Token) => void;
  disabled?: boolean;
  className?: string;
}

export const WrapTokenButton: React.FC<WrapTokenButtonProps> = ({
  token,
  amount,
  onWrapSuccess,
  disabled = false,
  className = "",
}) => {
  const { show } = useNotify();

  const handleWrapSuccess = () => {
    if (token && onWrapSuccess) {
      // Create the wrapped version of the native token
      const wrappedToken = createWrappedNativeToken(token.chainId);
      onWrapSuccess(wrappedToken);

      show({
        id: crypto.randomUUID(),
        type: "success",
        message: `Successfully wrapped ${token.ticker}!`,
        duration: 4000,
      });
    }
  };

  const handleWrapError = (error: Error) => {
    console.error("Wrap error:", error);

    const errorMessage = error?.message || "";
    const isUserRejection =
      errorMessage.includes("User rejected") ||
      errorMessage.includes("User denied") ||
      errorMessage.includes("user rejected") ||
      errorMessage.includes("rejected the request");

    if (isUserRejection) {
      show({
        id: crypto.randomUUID(),
        type: "info",
        message: "Wrap cancelled by user",
        duration: 3000,
      });
    } else {
      show({
        id: crypto.randomUUID(),
        type: "error",
        message: errorMessage || "Failed to wrap token",
        duration: 5000,
      });
    }
  };

  const { wrap, isPending, canWrap, needsWrapping } = useWrapNative({
    token,
    amount,
    onSuccess: handleWrapSuccess,
    onError: handleWrapError,
  });

  // Only show the button if the token needs wrapping
  if (!needsWrapping || !token || !isNativeToken(token)) {
    return null;
  }

  const handleClick = async () => {
    if (!canWrap) return;

    try {
      await wrap();
    } catch (error) {
      console.error("Failed to wrap token:", error);
    }
  };

  const buttonText = isPending
    ? `Wrapping ${token.ticker}...`
    : `Wrap ${token.ticker}`;

  return (
    <button
      data-testid="wrap-token-button"
      onClick={handleClick}
      disabled={disabled || isPending || !canWrap}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
    >
      {buttonText}
    </button>
  );
};
