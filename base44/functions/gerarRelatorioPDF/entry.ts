
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      mesSelecionado,
      receitaMensal,
      lucroLiquido,
      margemLiquida,
      custos,
      totalClientes,
      clientesAtivos,
      clientesInadimplentes,
      negociosAtivos
    } = await req.json();

    const doc = new jsPDF();
    let y = 20;

    // CABECALHO
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatorio Financeiro', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Periodo: ' + mesSelecionado, 105, 30, { align: 'center' });
    
    y = 50;
    doc.setTextColor(0, 0, 0);

    // RESUMO FINANCEIRO
    doc.setFillColor(239, 246, 255);
    doc.rect(10, y, 190, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO FINANCEIRO', 15, y + 7);
    y += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Receita
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.text('Receita Mensal:', 15, y);
    doc.text('R$ ' + receitaMensal.toFixed(2).replace('.', ','), 190, y, { align: 'right' });
    y += 8;

    // Lucro
    doc.setTextColor(lucroLiquido >= 0 ? 34 : 239, lucroLiquido >= 0 ? 197 : 68, lucroLiquido >= 0 ? 94 : 68);
    doc.text('Lucro Liquido:', 15, y);
    doc.text('R$ ' + lucroLiquido.toFixed(2).replace('.', ','), 190, y, { align: 'right' });
    y += 8;

    // Margem
    doc.setTextColor(147, 51, 234);
    doc.text('Margem Liquida:', 15, y);
    doc.text(margemLiquida.toFixed(2).replace('.', ',') + '%', 190, y, { align: 'right' });
    y += 8;

    // Custos
    doc.setTextColor(239, 68, 68);
    doc.text('Custos Totais:', 15, y);
    doc.text('R$ ' + custos.custoTotal.toFixed(2).replace('.', ','), 190, y, { align: 'right' });
    y += 15;

    // DETALHAMENTO DE CUSTOS
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(254, 243, 199);
    doc.rect(10, y, 190, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHAMENTO DE CUSTOS', 15, y + 7);
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    const detalheCustos = [
      { label: 'Impostos (9%)', valor: custos.impostos },
      { label: 'Taxas Cartao (4%)', valor: custos.taxasCartao },
      { label: 'Comissao Afiliados', valor: custos.comissaoAfiliados },
      { label: 'Custo Fixo', valor: custos.custoFixo }
    ];

    detalheCustos.forEach(item => {
      doc.text(item.label + ':', 15, y);
      doc.text('R$ ' + item.valor.toFixed(2).replace('.', ','), 190, y, { align: 'right' });
      y += 7;
    });

    y += 10;

    // CLIENTES
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(243, 244, 246);
    doc.rect(10, y, 190, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTES', 15, y + 7);
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    doc.text('Total de Clientes:', 15, y);
    doc.text(totalClientes.toString(), 190, y, { align: 'right' });
    y += 7;

    doc.text('Clientes Ativos:', 15, y);
    doc.text(clientesAtivos.toString(), 190, y, { align: 'right' });
    y += 7;

    doc.text('Clientes Inadimplentes:', 15, y);
    doc.text(clientesInadimplentes.toString(), 190, y, { align: 'right' });
    y += 15;

    // LISTA DE NEGOCIOS ATIVOS
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFillColor(220, 252, 231);
    doc.rect(10, y, 190, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NEGOCIOS ATIVOS', 15, y + 7);
    y += 15;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    // Cabecalho da tabela
    doc.text('Cliente', 15, y);
    doc.text('Empresa', 65, y);
    doc.text('Produto', 115, y);
    doc.text('Valor', 175, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    negociosAtivos.slice(0, 25).forEach((neg, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      // Zebrado
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(10, y - 3, 190, 6, 'F');
      }

      const cliente = neg.nome_cliente.substring(0, 22);
      const empresa = neg.nome_empresa.substring(0, 22);
      const produto = neg.produto.substring(0, 25);
      const valor = 'R$ ' + neg.valor_mensalidade.toFixed(2).replace('.', ',');

      doc.text(cliente, 15, y);
      doc.text(empresa, 65, y);
      doc.text(produto, 115, y);
      doc.text(valor, 175, y);
      y += 6;
    });

    if (negociosAtivos.length > 25) {
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('... e mais ' + (negociosAtivos.length - 25) + ' negocios ativos', 15, y);
    }

    // RODAPE
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const dataHora = new Date().toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(
        'Gloria Vendas - Gerado em ' + dataHora + ' - Pagina ' + i + '/' + totalPages,
        105,
        290,
        { align: 'center' }
      );
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="relatorio-financeiro-' + mesSelecionado.replace(/ /g, '-') + '.pdf"'
      }
    });

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json({ 
      error: 'Erro ao gerar PDF',
      message: error.message
    }, { status: 500 });
  }
});
