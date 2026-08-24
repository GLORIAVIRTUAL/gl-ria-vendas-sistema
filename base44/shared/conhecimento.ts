// Monta o bloco de Base de Conhecimento da Glória usado pela IA nas conversas.

const LIMITE_CARACTERES = 6000;

export async function montarBaseConhecimento(base44) {
  try {
    const itens = await base44.asServiceRole.entities.ConhecimentoItem.filter({ ativo: true }, 'ordem', 60);
    if (!itens || itens.length === 0) return '';

    let bloco = '\n---\nBASE DE CONHECIMENTO DA GLÓRIA (use estas informações como verdade; não invente dados):\n';

    for (const item of itens) {
      const linha = `\n[${item.categoria}] ${item.titulo}\n${(item.conteudo || '').trim()}\n`;
      if (bloco.length + linha.length > LIMITE_CARACTERES) break;
      bloco += linha;
    }

    bloco += '\nSe a resposta não estiver na base acima, não invente: diga que vai confirmar com o time.\n';
    return bloco;
  } catch (error) {
    console.error('⚠️ Erro ao montar base de conhecimento:', error.message);
    return '';
  }
}