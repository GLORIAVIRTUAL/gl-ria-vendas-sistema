import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Pencil, Check, X, Loader2 } from "lucide-react";
import { updateUserName } from "@/functions/updateUserName";
import { useToast } from "@/components/ui/use-toast";

export default function GerenciarUsuarios() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [novoNome, setNovoNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: usuarios = [], isLoading, refetch } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => base44.entities.User.list("-created_date"),
  });

  const iniciarEdicao = (usuario) => {
    setEditingId(usuario.id);
    setNovoNome(usuario.full_name || "");
  };

  const cancelarEdicao = () => {
    setEditingId(null);
    setNovoNome("");
  };

  const salvarNome = async (userId) => {
    if (!novoNome.trim()) {
      toast({ title: "Informe um nome válido", variant: "destructive" });
      return;
    }
    setSalvando(true);
    try {
      await updateUserName({ userId, fullName: novoNome.trim() });
      toast({ title: "✅ Nome atualizado com sucesso!" });
      cancelarEdicao();
      refetch();
    } catch (error) {
      toast({
        title: "Erro ao atualizar nome",
        description: error?.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gerenciar Usuários</h1>
          <p className="text-sm text-slate-500">Altere o nome dos usuários do sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    {editingId === usuario.id ? (
                      <Input
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                        placeholder="Nome do usuário"
                        autoFocus
                        className="max-w-sm"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 truncate">
                        {usuario.full_name || "(sem nome)"}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 truncate">{usuario.email}</p>
                  </div>

                  {editingId === usuario.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => salvarNome(usuario.id)}
                        disabled={salvando}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelarEdicao} disabled={salvando}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => iniciarEdicao(usuario)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar nome
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}