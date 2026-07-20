import React, { useEffect, useState } from "react";

export default function MunicipalitySelect({ uf, value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!uf) { setOptions([]); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setOptions(data.map((item) => item.nome)))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [uf]);
  return <select disabled={!uf || loading} className="h-9 rounded-md border border-input bg-slate-950/35 px-3 text-sm text-slate-100 disabled:opacity-60" value={value} onChange={(event) => onChange(event.target.value)}>
    <option value="">{!uf ? "Selecione primeiro o estado" : loading ? "Carregando municípios..." : "Todos os municípios"}</option>
    {options.map((name) => <option key={name} value={name}>{name}</option>)}
  </select>;
}