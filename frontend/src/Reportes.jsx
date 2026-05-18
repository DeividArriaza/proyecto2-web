import { useEffect, useState } from 'react';
import { api, palette } from './api.js';
import { ErrorBanner } from './Layout.jsx';
import { PageHeader } from './ProductosAdmin.jsx';

// Catálogo de reportes. Cada uno declara su endpoint, columnas y los ítems
// de rúbrica (II) que cubre — los badges aparecen en la UI para que sean
// visibles al evaluador.
const REPORTES = [
  {
    id: 'top-productos',
    titulo: 'Top productos más vendidos',
    descripcion: 'Productos con más unidades vendidas en ventas COMPLETADAS.',
    endpoint: '/reportes/top-productos',
    badges: ['CTE (WITH)', 'JOIN multi-tabla'],
    columns: [
      { key: 'sku',        label: 'SKU',       mono: true },
      { key: 'nombre',     label: 'Producto' },
      { key: 'categoria',  label: 'Categoría' },
      { key: 'marca',      label: 'Marca' },
      { key: 'unidades',   label: 'Unidades',   align: 'right' },
      { key: 'num_ventas', label: 'N° ventas',  align: 'right' },
      { key: 'ingresos',   label: 'Ingresos',   align: 'right', render: (r) => fmtQ(r.ingresos) },
    ],
  },
  {
    id: 'ventas-por-sucursal',
    titulo: 'Ventas por sucursal',
    descripcion: 'Sucursales con más de Q1,000 en ventas (HAVING).',
    endpoint: '/reportes/ventas-por-sucursal',
    badges: ['GROUP BY', 'HAVING', 'agregados (SUM, AVG, COUNT)', 'JOIN multi-tabla'],
    columns: [
      { key: 'sucursal',          label: 'Sucursal' },
      { key: 'num_ventas',        label: 'N° ventas',         align: 'right' },
      { key: 'empleados_activos', label: 'Empleados',         align: 'right' },
      { key: 'metodos_pago_usados', label: 'Métodos pago',    align: 'right' },
      { key: 'ingresos_totales',  label: 'Ingresos',          align: 'right', render: (r) => fmtQ(r.ingresos_totales) },
      { key: 'ticket_promedio',   label: 'Ticket promedio',   align: 'right', render: (r) => fmtQ(r.ticket_promedio) },
    ],
  },
  {
    id: 'productos-criticos',
    titulo: 'Productos críticos',
    descripcion: 'Productos con stock al mínimo o por debajo, contrastados con el promedio del catálogo.',
    endpoint: '/reportes/productos-criticos',
    badges: ['Subquery escalar (en SELECT)', 'Subquery con IN'],
    columns: [
      { key: 'sku',                      label: 'SKU', mono: true },
      { key: 'nombre',                   label: 'Producto' },
      { key: 'categoria',                label: 'Categoría' },
      { key: 'stock',                    label: 'Stock',     align: 'right' },
      { key: 'stock_minimo',             label: 'Stock mín', align: 'right' },
      { key: 'deficit',                  label: 'Déficit',   align: 'right' },
      { key: 'promedio_stock_catalogo',  label: 'Prom. catálogo', align: 'right' },
    ],
  },
  {
    id: 'clientes-frecuentes',
    titulo: 'Clientes frecuentes (compradores de brownies)',
    descripcion: 'Clientes con al menos una venta que incluyó productos de la categoría Brownies.',
    endpoint: '/reportes/clientes-frecuentes',
    badges: ['Subquery correlacionada (EXISTS)', 'JOIN multi-tabla'],
    columns: [
      { key: 'nombre',         label: 'Cliente', render: (r) => `${r.nombres} ${r.apellidos}` },
      { key: 'email',          label: 'Email',          render: (r) => r.email ?? '—' },
      { key: 'total_compras',  label: 'N° compras',     align: 'right' },
      { key: 'total_gastado',  label: 'Total gastado',  align: 'right', render: (r) => fmtQ(r.total_gastado) },
      { key: 'ultima_compra',  label: 'Última compra',  render: (r) => fmtDate(r.ultima_compra) },
    ],
  },
];

export default function Reportes() {
  const [active, setActive] = useState(REPORTES[0].id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reporte = REPORTES.find((r) => r.id === active);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData([]);
    api(reporte.endpoint)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [active, reporte.endpoint]);

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle="Consultas analíticas alimentadas por la base de datos"
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 22,
          background: palette.surface,
          padding: 8,
          borderRadius: 14,
          border: `1px solid ${palette.border}`,
        }}
      >
        {REPORTES.map((r) => (
          <button
            key={r.id}
            onClick={() => setActive(r.id)}
            style={{
              border: 'none',
              padding: '8px 16px',
              borderRadius: 999,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: r.id === active ? palette.primary : 'transparent',
              color: r.id === active ? 'white' : palette.textSoft,
            }}
          >
            {r.titulo}
          </button>
        ))}
      </div>

      <ErrorBanner error={error} onClose={() => setError(null)} />

      <div
        style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: 22,
          boxShadow: '0 4px 18px rgba(199, 21, 133, 0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 6px', color: palette.text }}>{reporte.titulo}</h3>
            <p style={{ margin: '0 0 10px', color: palette.textSoft, fontSize: '0.9rem' }}>
              {reporte.descripcion}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {reporte.badges.map((b) => (
                <span
                  key={b}
                  style={{
                    background: palette.bg,
                    color: palette.primary,
                    border: `1px solid ${palette.border}`,
                    fontSize: '0.7rem',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => downloadCSV(`${reporte.id}.csv`, reporte.columns, data)}
              disabled={loading || data.length === 0}
              style={exportBtnStyle(loading || data.length === 0)}
            >
              ↓ Exportar CSV
            </button>
            <button
              onClick={() => window.print()}
              disabled={loading || data.length === 0}
              style={exportBtnStyle(loading || data.length === 0, true)}
            >
              ⎙ Exportar PDF
            </button>
          </div>
        </div>

        <div className="reporte-printable table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                {reporte.columns.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      textAlign: c.align ?? 'left',
                      padding: '10px 14px',
                      background: palette.bg,
                      color: palette.textSoft,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      borderBottom: `1px solid ${palette.border}`,
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={reporte.columns.length} style={{ padding: 24, textAlign: 'center', color: palette.textSoft }}>
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && data.length === 0 && !error && (
                <tr>
                  <td colSpan={reporte.columns.length} style={{ padding: 24, textAlign: 'center', color: palette.textSoft }}>
                    Sin resultados.
                  </td>
                </tr>
              )}
              {!loading && data.map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${palette.border}` }}>
                  {reporte.columns.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding: '10px 14px',
                        textAlign: c.align ?? 'left',
                        fontFamily: c.mono ? 'ui-monospace, SFMono-Regular, monospace' : 'inherit',
                        verticalAlign: 'middle',
                      }}
                    >
                      {c.render ? c.render(row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmtQ(value) {
  if (value == null) return '—';
  const n = Number(value);
  return `Q${n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// Serializa columnas+filas a CSV y dispara descarga vía Blob.
// Cada celda se cuota con comillas dobles y se escapan internas según RFC 4180.
function downloadCSV(filename, columns, rows) {
  const header = columns.map((c) => csvCell(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => csvCell(c.render ? c.render(row) : row[c.key])).join(',')
  );
  const csv = '﻿' + [header, ...body].join('\r\n'); // BOM para Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  if (value == null) return '""';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

function exportBtnStyle(disabled, ghost = false) {
  return {
    background: ghost ? 'transparent' : palette.primary,
    border: ghost ? `1px solid ${palette.primary}` : 'none',
    color: ghost ? palette.primary : 'white',
    padding: '8px 16px',
    borderRadius: 999,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: '0.85rem',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  };
}
