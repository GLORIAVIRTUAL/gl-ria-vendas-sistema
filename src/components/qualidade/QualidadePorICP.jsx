import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function QualidadePorICP({ linhas }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho por ICP</CardTitle>
      </CardHeader>
      <CardContent>
        {linhas.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum prospect com ICP identificado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ICP</TableHead>
                <TableHead className="text-right">Prospects</TableHead>
                <TableHead className="text-right">Com contato</TableHead>
                <TableHead className="text-right">Quentes</TableHead>
                <TableHead className="text-right">Score médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.nome}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell className="text-right">{l.total}</TableCell>
                  <TableCell className="text-right">{l.comContato}</TableCell>
                  <TableCell className="text-right">{l.quentes}</TableCell>
                  <TableCell className="text-right">{l.scoreMedio}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}