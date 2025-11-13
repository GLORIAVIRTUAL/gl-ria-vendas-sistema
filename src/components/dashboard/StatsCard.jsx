import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function StatsCard({ titulo, valor, icon: Icon, cor, tendencia }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cor} opacity-10 rounded-full transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-300`} />
      <CardContent className="p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${cor} shadow-md`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-600 mb-1">{titulo}</p>
        <p className="text-3xl font-bold text-slate-900 mb-2">{valor}</p>
        {tendencia && (
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="font-medium">{tendencia}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}