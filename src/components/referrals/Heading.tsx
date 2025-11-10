// src/components/referrals/Heading.tsx

import { ReferralResponse } from "@/hooks/useUserReferralData";
import EnterCode from "./call-to-action/EnterCode";
import ViewCode from "./call-to-action/ViewCode";

type headingProps = {
  data: ReferralResponse;
  referralCode: string | null;
};

const Heading = ({ data, referralCode }: headingProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-4xl mb-1">Referrals</h2>
        <p>Refer users to earn rewards.</p>
      </div>

      <div className="flex items-center gap-4">
        <EnterCode data={data} referralCode={referralCode} />
        <ViewCode code={data.referralCode} />
        <button
          disabled
          className="text-primary disabled:opacity-50 disabled:cursor-not-allowed border-primary border-2 px-4 py-2.5 cursor-pointer bg-primary/10 transition-all active:bg-primary/20 rounded-lg text-sm"
        >
          Claim Rewards
        </button>
      </div>
    </div>
  );
};

export default Heading;
