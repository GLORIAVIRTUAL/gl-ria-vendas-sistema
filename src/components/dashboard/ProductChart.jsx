
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package } from "lucide-react";

const coresGrafico = {
  Atendimento_IA_24_7: '#3B82F6',
  Maquina_de_Videos: '#A855F7',
  Gloria_Clinica: '#10B981',
  Gloria_Vendas: '#F59E0B',
  Especialistas_Virtuais: '#EC4899',
  Sites_em_24_Horas: '#06B6D4'
};

export default function ProductChart({ agendamentosPorProduto, produtoConfig, isLoading }) {
  const dados = Object.entries(agendamentosPorProduto).map(([produto, count]) => ({
    nome: produtoConfig[produto]?.nome || produto,
    total: count,
    cor: coresGrafico[produto]
  }));

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-600" />
          <CardTitle>Reuniões por Produto</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {dados.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="nome" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {dados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">
            Nenhum agendamento ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
}
