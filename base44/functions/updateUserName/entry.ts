import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admin pode atualizar nomes de outros usuários
    if (currentUser.role !== 'admin') {
      return Response.json({ error: 'Apenas administradores podem editar usuários' }, { status: 403 });
    }

    const { userId, fullName } = await req.json();

    if (!userId || !fullName) {
      return Response.json({ error: 'userId e fullName são obrigatórios' }, { status: 400 });
    }

    // Usa service role para atualizar o usuário
    await base44.asServiceRole.entities.User.update(userId, { full_name: fullName });

    return Response.json({ success: true, message: 'Nome atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});