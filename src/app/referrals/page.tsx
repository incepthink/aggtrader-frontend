// src/app/referrals/page.tsx

"use client";

import GenericTable, { Column } from "@/components/common/ui/GenericTable";
import GlowBox from "@/components/common/ui/GlowBox";
import Card from "@/components/referrals/Card";
import Heading from "@/components/referrals/Heading";
import { ReferredUser, useUserReferralData } from "@/hooks/useUserReferralData";
import { Container } from "@mui/material";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";

interface Trade {
  coin: string;
  size: string;
  executedSize: string;
  avgPrice: string;
  runningTime: string;
  reduceOnly: boolean;
  creationTime: string;
  terminate: string;
}

const Page = () => {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("code");

  const columns: Column<ReferredUser>[] = [
    {
      key: "address", // Changed from "coin"
      header: "Address",
      align: "left",
    },
    {
      key: "dateReferred", // Changed from "dateJoined"
      header: "Date Joined",
      align: "left",
      render: (row) => (
        <span className="text-teal-400">
          {new Date(row.dateReferred).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "volumeTraded", // Changed from "totalVolume"
      header: "Total Volume",
      align: "left",
      render: (row) => <span>${parseFloat(row.volumeTraded).toFixed(2)}</span>,
    },
    {
      key: "rewardsGenerated", // Changed from "yourRewards"
      header: "Your Rewards",
      align: "left",
      render: (row) => (
        <span>${parseFloat(row.rewardsGenerated).toFixed(2)}</span>
      ),
    },
  ];

  const { address, isConnected } = useAccount();
  const { data: referralData, isLoading } = useUserReferralData(address);
  console.log("referralData", referralData);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center px-4">
          Connect Your Wallet
        </p>
      </div>
    );
  }

  if (isLoading || !referralData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center px-4">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <>
      <Container className="p-4 md:pt-9">
        <Heading referralCode={referralCode} data={referralData} />

        <div className="mt-6">
          <div className="flex gap-4 *:min-w-xs mb-4">
            {[
              {
                heading: "Traders Referred",
                value: referralData.stats.tradersReferred,
              },
              {
                heading: "Rewards Earned",
                value: `$${referralData.stats.rewardsEarned}`,
              },
              {
                heading: "Claimable Rewards",
                value: `$${(
                  parseFloat(referralData.stats.rewardsEarned) -
                  parseFloat(referralData.stats.rewardsClaimed)
                ).toFixed(2)}`,
              },
            ].map((item: any, index) => {
              return (
                <Card key={index} heading={item.heading} value={item.value} />
              );
            })}
          </div>
          <GlowBox spread={16} padding={1}>
            <GenericTable
              columns={columns}
              data={referralData.referred}
              keyExtractor={(row, index) => `${row.address}-${index}`}
              emptyMessage="No Referrals Yet"
              hoverable={true}
            />
          </GlowBox>
        </div>
      </Container>
    </>
  );
};

export default Page;
