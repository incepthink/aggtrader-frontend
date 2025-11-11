import GlowBox from "../common/ui/GlowBox";

interface CardProps {
  heading: string;
  value: string;
}

const Card = ({ heading, value }: CardProps) => {
  return (
    <GlowBox spread={16}>
      <div>
        <p className="text-sm text-gray-400 mb-2">{heading}</p>
        <p className="text-3xl">{value}</p>
      </div>
    </GlowBox>
  );
};

export default Card;
