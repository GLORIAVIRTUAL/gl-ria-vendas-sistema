import { Card, CardContent } from "@/components/ui/card";

const accents = {
  blue: "border-blue-400/40",
  green: "border-green-400/40",
  orange: "border-orange-400/40",
  purple: "border-purple-400/40",
};

export default function StatsCard({ title, value, color = "blue", trendValue }) {
  return (
    <Card className={`border ${accents[color]} shadow-lg`}>
      <CardContent className="p-6">
        <p className="mb-2 text-sm font-medium text-cyan-100">{title}</p>
        <p className="text-3xl font-bold text-cyan-200">{value}</p>
        {trendValue && <p className="mt-2 text-xs text-slate-400">{trendValue}</p>}
      </CardContent>
    </Card>
  );
}