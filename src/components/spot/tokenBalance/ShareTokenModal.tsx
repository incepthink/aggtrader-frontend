// components/spot/tokenBalance/ShareTokenModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import html2canvas from "html2canvas";
import type { CombinedToken } from "@/types/portfolio";
import {
  formatUSD,
  formatPercent,
  getTokenLogo,
} from "@/utils/spot/tokenUtils";
import KatanaLogo from "@/components/common/navbar/KatanaLogo";
import {
  ReferralResponse,
  useUserReferralData,
} from "@/hooks/useUserReferralData";
import { useAccount } from "wagmi";

interface ShareTokenModalProps {
  open: boolean;
  onClose: () => void;
  token: CombinedToken;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  roi: number;
  referralData: ReferralResponse;
}

export const ShareTokenModal: React.FC<ShareTokenModalProps> = ({
  open,
  onClose,
  token,
  entryPrice,
  currentPrice,
  pnl,
  roi,
  referralData,
}) => {
  const [customText, setCustomText] = useState(
    `Trade $${token.symbol} seamlessly on @katana at @agg_trade using my referral code https://aggtrade.xyz/join/${referralData?.referralCode}`
  );
  const [copied, setCopied] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const isProfitable = pnl >= 0;
  const tokenLogo = token.logoUrl;

  // Convert image to base64 to fix Chromium CORS caching issue
  useEffect(() => {
    if (!open || !tokenLogo) return;

    const convertImageToDataUrl = async () => {
      try {
        const response = await fetch(tokenLogo);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          setLogoDataUrl(reader.result as string);
        };

        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to convert image to data URL:", error);
        // Fallback to original URL if conversion fails
        setLogoDataUrl(tokenLogo);
      }
    };

    convertImageToDataUrl();
  }, [open, tokenLogo]);

  const handleCopyLink = () => {
    // TODO: Add your referral link generation logic here
    const shareUrl = `https://app.aggtrade.xyz`; // Placeholder
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveImage = async () => {
    if (!canvasRef.current) {
      console.error("Canvas ref not available");
      return;
    }

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: "#0a0f1e",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        imageTimeout: 0,
      });

      // Try data URL method first
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `aggtrade-${token.symbol}-trade.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dataUrlError) {
        console.error("Data URL method failed:", dataUrlError);
        // Fallback to blob method
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error("Failed to create blob");
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `aggtrade-${token.symbol}-trade.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, "image/png");
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.message : error
      );
      alert(
        `Failed to save image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleShareOnX = () => {
    const text = encodeURIComponent(customText);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#0f1729",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <div className="relative">
          {/* Close Button */}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              zIndex: 10,
            }}
          >
            <CloseIcon />
          </IconButton>

          <div className="flex flex-col md:flex-row">
            {/* Left Side - Canvas Preview */}
            <div className="flex-1 p-8 bg-[#0a0f1e]">
              <div
                ref={canvasRef}
                className="relative w-full aspect-square rounded-2xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #1a2332 0%, #0f1729 100%)",
                }}
              >
                {/* Concentric circles background */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <svg className="absolute w-full h-full" viewBox="0 0 400 400">
                    {[...Array(20)].map((_, i) => (
                      <circle
                        key={i}
                        cx="200"
                        cy="200"
                        r={40 + i * 16}
                        fill="none"
                        stroke="rgba(0, 245, 224, 0.05)"
                        strokeWidth="1"
                      />
                    ))}
                  </svg>

                  {/* Central token logo */}
                  <div
                    className="absolute w-32 h-32 rounded-full flex items-center justify-center z-5"
                    style={{
                      background:
                        "linear-gradient(to bottom right, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))",
                      border: "2px solid rgba(6, 182, 212, 0.3)",
                    }}
                  >
                    {logoDataUrl ? (
                      <img
                        src={logoDataUrl}
                        alt={token.symbol}
                        className="w-20 h-20 rounded-full"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-cyan-300">
                          {token.symbol.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  {/* Header */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex gap-1 items-center">
                        <div className="w-8 h-8">
                          <img
                            src="/assets/aggtrade.png"
                            alt="AggTrade Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className="font-bold "
                          style={{ color: "#ffffff", fontSize: "22px" }}
                        >
                          AggTrade
                        </div>
                      </div>
                      <div className="-mr-16">
                        <KatanaLogo />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="font-medium"
                        style={{ color: "#ffffff", fontSize: "20px" }}
                      >
                        {token.symbol}
                      </div>
                      <div
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: isProfitable
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(239, 68, 68, 0.2)",
                          color: isProfitable ? "#4ade80" : "#f87171",
                        }}
                      >
                        {isProfitable ? "PROFIT" : "LOSS"}
                      </div>
                    </div>
                    {/* ROI Display */}
                    <div
                      className="font-bold mt-6"
                      style={{
                        fontSize: "60px",
                        color: isProfitable ? "#4ade80" : "#f87171",
                      }}
                    >
                      {isProfitable ? "+" : ""}
                      {formatPercent(roi)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="">
                    {/* Price Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div>
                        <div
                          className="text-sm mb-1"
                          style={{ color: "#67e8f9" }}
                        >
                          Entry Price
                        </div>
                        <div
                          className="font-medium text-lg"
                          style={{ color: "#ffffff" }}
                        >
                          ${entryPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-sm mb-1"
                          style={{ color: "#67e8f9" }}
                        >
                          Current Price
                        </div>
                        <div
                          className="font-medium text-lg"
                          style={{ color: "#ffffff" }}
                        >
                          ${currentPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* P&L */}
                    {/* <div
                      className="pt-4"
                      style={{
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-lg" style={{ color: "#67e8f9" }}>
                          P&L
                        </div>
                        <div
                          className="font-bold text-xl"
                          style={{
                            color: isProfitable ? "#4ade80" : "#f87171",
                          }}
                        >
                          {isProfitable ? "+" : ""}
                          {formatUSD(pnl)}
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Controls */}
            <div className="w-full md:w-80 p-6 border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">
                  Share Your Trade
                </h3>

                {/* Token Info Summary */}
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {tokenLogo && (
                      <img
                        src={tokenLogo}
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-white font-semibold">
                      {token.symbol}
                    </span>
                    <span className="text-gray-400 text-sm">{token.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Entry: </span>
                      <span className="text-white">
                        ${entryPrice.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Current: </span>
                      <span className="text-white">
                        ${currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Text */}
                <div className="mb-6">
                  <label className="text-cyan-300 text-sm mb-2 block">
                    Customize your text:
                  </label>
                  <TextField
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    multiline
                    rows={5}
                    fullWidth
                    placeholder="Add your message..."
                    sx={{
                      "& .MuiInputBase-root": {
                        color: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  />
                </div>
              </div>

              {/* Referral Section Placeholder */}
              {/* <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="text-yellow-400 text-xs">
                  💡 Tip: Referral link functionality can be added here
                </div>
              </div> */}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleSaveImage}
                  sx={{
                    backgroundColor: "#00f5e0",
                    color: "#0a0f1e",
                    fontWeight: 600,
                    textTransform: "none",
                    py: 1.5,
                    "&:hover": {
                      backgroundColor: "#00d4c7",
                    },
                  }}
                >
                  Save Image
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyLink}
                  sx={{
                    borderColor: "rgba(0, 245, 224, 0.3)",
                    color: "#00f5e0",
                    textTransform: "none",
                    py: 1.5,
                    "&:hover": {
                      borderColor: "#00f5e0",
                      backgroundColor: "rgba(0, 245, 224, 0.1)",
                    },
                  }}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={handleShareOnX}
                  sx={{
                    borderColor: "rgba(0, 245, 224, 0.3)",
                    color: "#00f5e0",
                    textTransform: "none",
                    py: 1.5,
                    "&:hover": {
                      borderColor: "#00f5e0",
                      backgroundColor: "rgba(0, 245, 224, 0.1)",
                    },
                  }}
                >
                  Share on X
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
