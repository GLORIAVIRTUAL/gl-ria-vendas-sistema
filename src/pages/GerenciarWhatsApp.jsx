import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Phone, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Search,
  MessageSquare,
  Building2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GerenciarWhatsApp() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    nome_identificacao: '',
    phone_number_id: '',
    numero_telefone: '',
    cliente_associado: '',
    cliente_id: '',
    access_token: '',
    ativo: true,
    webhook_url: '',
    observacoes: ''
  });

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['whatsapp-gateways'],
    queryFn: () => base44.entities.WhatsAppGateway.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WhatsAppGateway.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-gateways'] });
      toast.success('Número adicionado com sucesso!');
      closeDialog();
    },
    onError: () => {
      toast.error('Erro ao adicionar número');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WhatsAppGateway.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-gateways'] });
      toast.success('Número atualizado!');
      closeDialog();
    },
    onError: () => {
      toast.error('Erro ao atualizar');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WhatsAppGateway.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-gateways'] });
      toast.success('Número excluído');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }) => base44.entities.WhatsAppGateway.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-gateways'] });
      toast.success('Status atualizado!');
    },
  });

  const openDialog = (gateway = null) => {
    if (gateway) {
      setEditingGateway(gateway);
      setFormData(gateway);
    } else {
      setEditingGateway(null);
      setFormData({
        nome_identificacao: '',
        phone_number_id: '',
        numero_telefone: '',
        cliente_associado: '',
        cliente_id: '',
        access_token: '',
        ativo: true,
        webhook_url: window.location.origin + '/api/functions/whatsapp/webhookMeta',
        observacoes: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingGateway(null);
  };

  const handleSubmit = () => {
    if (!formData.nome_identificacao || !formData.phone_number_id || !formData.numero_telefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (editingGateway) {
      updateMutation.mutate({ id: editingGateway.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const filteredGateways = gateways.filter(g => 
    g.nome_identificacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.cliente_associado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.numero_telefone?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-green-600" />
              Gateway WhatsApp
            </h1>
            <p className="text-slate-600">
              Gerencie múltiplos números e associe clientes
            </p>
          </div>
          <Button
            onClick={() => openDialog()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Número
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total de Números</p>
                  <p className="text-2xl font-bold text-slate-900">{gateways.length}</p>
                </div>
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Números Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {gateways.filter(g => g.ativo).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Clientes Associados</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(gateways.filter(g => g.cliente_associado).map(g => g.cliente_associado)).size}
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, cliente ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Números Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : filteredGateways.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum número cadastrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificação</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Phone ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGateways.map((gateway) => (
                    <TableRow key={gateway.id}>
                      <TableCell className="font-medium">
                        {gateway.nome_identificacao}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-600" />
                          {gateway.numero_telefone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {gateway.cliente_associado ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            {gateway.cliente_associado}
                          </div>
                        ) : (
                          <span className="text-slate-400">Não associado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {gateway.phone_number_id.substring(0, 15)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={gateway.ativo}
                            onCheckedChange={(checked) => 
                              toggleActiveMutation.mutate({ id: gateway.id, ativo: checked })
                            }
                          />
                          <Badge variant={gateway.ativo ? "default" : "secondary"}>
                            {gateway.ativo ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Inativo
                              </>
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(gateway)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(gateway.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGateway ? 'Editar Número' : 'Adicionar Novo Número'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome/Identificação *</Label>
              <Input
                placeholder="Ex: WhatsApp Principal, Cliente XPTO"
                value={formData.nome_identificacao}
                onChange={(e) => setFormData({...formData, nome_identificacao: e.target.value})}
              />
            </div>

            <div>
              <Label>Phone Number ID (Meta) *</Label>
              <Input
                placeholder="Ex: 123456789012345"
                value={formData.phone_number_id}
                onChange={(e) => setFormData({...formData, phone_number_id: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">
                Encontre em: Meta Business → WhatsApp → Configurações da API
              </p>
            </div>

            <div>
              <Label>Número de Telefone *</Label>
              <Input
                placeholder="Ex: +55 11 99999-9999"
                value={formData.numero_telefone}
                onChange={(e) => setFormData({...formData, numero_telefone: e.target.value})}
              />
            </div>

            <div>
              <Label>Cliente Associado</Label>
              <Input
                placeholder="Ex: Empresa XYZ Ltda"
                value={formData.cliente_associado}
                onChange={(e) => setFormData({...formData, cliente_associado: e.target.value})}
              />
            </div>

            <div>
              <Label>Access Token (opcional)</Label>
              <Input
                type="password"
                placeholder="Deixe vazio para usar token global"
                value={formData.access_token}
                onChange={(e) => setFormData({...formData, access_token: e.target.value})}
              />
            </div>

            <div>
              <Label>URL do Webhook</Label>
              <Input
                placeholder="https://seu-dominio.com/api/functions/whatsapp/webhookMeta"
                value={formData.webhook_url}
                onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">
                Configure esta URL no Meta Business Manager
              </p>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Notas sobre este número..."
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
              />
              <Label>Número ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingGateway ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir número?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O número será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}