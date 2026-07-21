import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Bird, Building2, Briefcase, Phone } from 'lucide-react';
import { toast } from 'sonner';
import ClienteOpenClawDialog from '../components/openclaw/ClienteOpenClawDialog';

export default function ClientesOpenClaw() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes-openclaw'],
    queryFn: () => base44.entities.ClienteOpenClaw.list('-created_date'),
  });

  const sincronizarContato = async (data) => {
    const telLimpo = (data.telefone_cliente || '').replace(/\D/g, '');
    if (!telLimpo) return;
    const destino = data.ativo === false ? 'atual' : 'openclaw';
    const contatos = await base44.entities.Contact.list('-created_date', 500);
    const alvos = contatos.filter((ct) => {
      const t = (ct.phone || '').replace(/\D/g, '');
      return t && (t === telLimpo || t.endsWith(telLimpo) || telLimpo.endsWith(t));
    });
    await Promise.all(
      alvos.map((ct) => base44.entities.Contact.update(ct.id, { llm_destino: destino }))
    );
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const saved = editing
        ? await base44.entities.ClienteOpenClaw.update(editing.id, data)
        : await base44.entities.ClienteOpenClaw.create(data);
      await sincronizarContato(data);
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-openclaw'] });
      setDialogOpen(false);
      setEditing(null);
      toast.success(editing ? 'Cliente atualizado!' : 'Cliente cadastrado!');
    },
    onError: () => toast.error('Erro ao salvar cliente'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClienteOpenClaw.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-openclaw'] });
      toast.success('Cliente removido!');
    },
  });

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (cliente) => {
    setEditing(cliente);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-3 rounded-xl">
            <Bird className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Clientes OpenClaw</h1>
            <p className="text-sm text-slate-500">
              Contatos roteados para a LLM do OpenClaw (a IA atual não responde a estes)
            </p>
          </div>
        </div>
        <Button onClick={handleNew} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : clientes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bird className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum cliente OpenClaw cadastrado ainda.</p>
            <p className="text-sm">Cadastre clientes para roteá-los para a LLM do OpenClaw.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome_cliente}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3 h-3" /> {c.telefone_cliente}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Building2 className="w-3 h-3" /> {c.empresa || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Briefcase className="w-3 h-3" /> {c.cargo || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {c.ativo === false ? (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500">Inativo</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-none">OpenClaw</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(c)}>
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
                        onClick={() => deleteMutation.mutate(c.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ClienteOpenClawDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(data) => saveMutation.mutate(data)}
        cliente={editing}
      />
    </div>
  );
}