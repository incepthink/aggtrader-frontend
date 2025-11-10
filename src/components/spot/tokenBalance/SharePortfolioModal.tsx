// components/portfolio/SharePortfolioModal.tsx
"use client";

import { useState, useRef } from "react";
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
import type { PortfolioTotals } from "@/utils/spot/portfolioCalculations";
import type { CombinedToken } from "@/types/portfolio";

interface SharePortfolioModalProps {
  open: boolean;
  onClose: () => void;
  portfolioTotals: PortfolioTotals;
  tokens: CombinedToken[];
  chainName: string;
  userAddress: string;
}

export const SharePortfolioModal: React.FC<SharePortfolioModalProps> = ({
  open,
  onClose,
  portfolioTotals,
  tokens,
  chainName,
  userAddress,
}) => {
  const [customText, setCustomText] = useState(
    `Check out my portfolio on @AggTrade`
  );
  const [referralCode] = useState(
    `app.aggtrade.xyz/${userAddress.slice(0, 8)}`
  );
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate top token
  const topToken = tokens.reduce(
    (max, token) => (token.value_usd > max.value_usd ? token : max),
    tokens[0]
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: "#0a0f1e",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = "aggtrade-portfolio.png";
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    }
  };

  const handleShareOnX = () => {
    const text = encodeURIComponent(`${customText}\n\nhttps://${referralCode}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const isProfitable = portfolioTotals.customTotalPnL >= 0;

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
                <div className="absolute inset-0 flex items-center justify-center">
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

                  {/* Central logo/icon */}
                  <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border-2 border-cyan-500/30">
                    <div className="text-6xl">📊</div>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  {/* Header */}
                  <div>
                    <div className="text-white text-2xl font-bold mb-1">
                      AggTrade
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium">
                        {topToken?.symbol || ""}
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isProfitable
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {isProfitable ? "LONG" : "SHORT"}{" "}
                        {tokens.length > 0 ? `${tokens.length}X` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-auto">
                    <div
                      className={`text-5xl font-bold mb-4 ${
                        isProfitable ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isProfitable ? "+" : ""}
                      {portfolioTotals.customTotalROI
                        ? (portfolioTotals.customTotalROI * 100).toFixed(1)
                        : "0.0"}
                      %
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-cyan-300 mb-1">Total Value</div>
                        <div className="text-white font-medium">
                          ${portfolioTotals.customTotalValue.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-cyan-300 mb-1">P&L</div>
                        <div
                          className={`font-medium ${
                            isProfitable ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {isProfitable ? "+" : ""}$
                          {portfolioTotals.customTotalPnL.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Referral Code */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-cyan-300 text-xs mb-1">
                        Referral code:
                      </div>
                      <div className="text-white text-sm font-mono">
                        https://{referralCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Controls */}
            <div className="w-full md:w-80 p-6 border-t md:border-t-0 md:border-l border-white/10">
              <h3 className="text-white text-lg font-semibold mb-4">
                Share Portfolio
              </h3>

              {/* Referral Code */}
              <div className="mb-4">
                <label className="text-cyan-300 text-sm mb-2 block">
                  Referral code:
                </label>
                <div className="flex gap-2">
                  <TextField
                    value={referralCode}
                    disabled
                    fullWidth
                    size="small"
                    sx={{
                      "& .MuiInputBase-root": {
                        color: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        fontSize: "0.875rem",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  />
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
                  rows={3}
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
