// src/components/referral/Heading.tsx

import { ReferralResponse } from "@/hooks/useUserReferralData";
import EnterCode from "./call-to-action/EnterCode";
import ViewCode from "./call-to-action/ViewCode";

type headingProps = {
  data: ReferralResponse;
  referralCode: string | null;
  tradersReffered: number;
};

const Heading = ({ data, referralCode, tradersReffered }: headingProps) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h2 className="text-2xl md:text-4xl mb-1">Referral</h2>
        <p className="text-sm md:text-md text-gray-400">
          Traders Referred: {tradersReffered}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        <EnterCode data={data} referralCode={referralCode} />
        <ViewCode code={data.referralCode} />
        {/* <button
          disabled
          className="text-primary disabled:opacity-50 disabled:cursor-not-allowed border-primary border-2 px-3 md:px-4 py-2 md:py-2.5 cursor-pointer bg-primary/10 transition-all active:bg-primary/20 rounded-lg text-xs md:text-sm whitespace-nowrap"
        >
          Claim Rewards
        </button> */}
      </div>
    </div>
  );
};

export default Heading;
