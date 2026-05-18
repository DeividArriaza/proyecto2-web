import { useEffect, useState } from 'react';
import { api, palette } from './api.js';
import { ErrorBanner, SuccessBanner, Modal, formStyles } from './Layout.jsx';
import { validateProducto, hasErrors } from './lib/validators.js';

const emptyForm = {
  sku: '',
  nombre: '',
  descripcion: '',
  precio: '',
  stock: 0,
  stock_minimo: 0,
  id_categoria: '',
  id_marca: '',
};

export default function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [modal, setModal] = useState({ open: false, mode: 'create', form: emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  async function load() {
    try {
      const [ps, cs, ms] = await Promise.all([
        api('/productos'),
        api('/categorias'),
        api('/marcas'),
      ]);
      setProductos(ps);
      setCategorias(cs);
      setMarcas(ms);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setModal({ open: true, mode: 'create', form: emptyForm });
    setFieldErrors({});
  }

  function openEdit(p) {
    setModal({
      open: true,
      mode: 'edit',
      form: {
        id_producto: p.id_producto,
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion ?? '',
        precio: p.precio,
        stock: p.stock,
        stock_minimo: p.stock_minimo,
        id_categoria: p.id_categoria,
        id_marca: p.id_marca,
      },
    });
    setFieldErrors({});
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
    setFieldErrors({});
  }

  function setField(name, value) {
    setModal((m) => ({ ...m, form: { ...m.form, [name]: value } }));
    if (fieldErrors[name]) {
      setFieldErrors((fe) => {
        const next = { ...fe };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const errs = validateProducto(modal.form);
    if (hasErrors(errs)) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sku: modal.form.sku,
        nombre: modal.form.nombre,
        descripcion: modal.form.descripcion,
        precio: modal.form.precio,
        stock: modal.form.stock,
        stock_minimo: modal.form.stock_minimo,
        id_categoria: modal.form.id_categoria,
        id_marca: modal.form.id_marca,
      };
      if (modal.mode === 'create') {
        await api('/productos', { method: 'POST', body: JSON.stringify(payload) });
        setSuccess('Producto creado correctamente');
      } else {
        await api(`/productos/${modal.form.id_producto}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess('Producto actualizado correctamente');
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(p) {
    if (!confirm(`¿Eliminar el producto "${p.nombre}"?`)) return;
    setError(null);
    try {
      await api(`/productos/${p.id_producto}`, { method: 'DELETE' });
      setSuccess('Producto eliminado');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle={`${productos.length} productos activos`}
        action={<button onClick={openCreate} style={formStyles.primaryBtn}>+ Nuevo producto</button>}
      />

      <ErrorBanner error={error} onClose={() => setError(null)} />
      <SuccessBanner message={success} onClose={() => setSuccess(null)} />

      <div style={tableCardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <Th>SKU</Th>
              <Th>Nombre</Th>
              <Th>Categoría</Th>
              <Th>Marca</Th>
              <Th align="right">Precio</Th>
              <Th align="right">Stock</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id_producto} style={{ borderTop: `1px solid ${palette.border}` }}>
                <Td mono>{p.sku}</Td>
                <Td>
                  <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                  {p.stock_bajo && (
                    <span
                      style={{
                        background: palette.accent,
                        color: 'white',
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: 999,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        fontWeight: 700,
                      }}
                    >
                      Bajo stock
                    </span>
                  )}
                </Td>
                <Td>{p.categoria}</Td>
                <Td>{p.marca}</Td>
                <Td align="right">Q{Number(p.precio).toFixed(2)}</Td>
                <Td align="right">{p.stock}</Td>
                <Td>
                  <button onClick={() => openEdit(p)} style={linkBtn}>Editar</button>
                  <button onClick={() => handleDelete(p)} style={{ ...linkBtn, color: '#B22222' }}>Eliminar</button>
                </Td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <Td colSpan={7}>
                  <div style={{ textAlign: 'center', padding: 24, color: palette.textSoft }}>
                    No hay productos activos.
                  </div>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.mode === 'create' ? 'Nuevo producto' : 'Editar producto'}
      >
        <form onSubmit={handleSubmit} noValidate>
          <Field label="SKU" required error={fieldErrors.sku}>
            <input
              value={modal.form.sku}
              onChange={(e) => setField('sku', e.target.value)}
              style={inputStyleWithError(fieldErrors.sku)}
              aria-invalid={!!fieldErrors.sku}
            />
          </Field>
          <Field label="Nombre" required error={fieldErrors.nombre}>
            <input
              value={modal.form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              style={inputStyleWithError(fieldErrors.nombre)}
              aria-invalid={!!fieldErrors.nombre}
            />
          </Field>
          <Field label="Descripción">
            <textarea
              rows={2}
              value={modal.form.descripcion}
              onChange={(e) => setField('descripcion', e.target.value)}
              style={{ ...formStyles.input, resize: 'vertical' }}
            />
          </Field>
          <div className="form-grid-3">
            <Field label="Precio (Q)" required error={fieldErrors.precio}>
              <input
                type="number" step="0.01" min="0"
                value={modal.form.precio}
                onChange={(e) => setField('precio', e.target.value)}
                style={inputStyleWithError(fieldErrors.precio)}
                aria-invalid={!!fieldErrors.precio}
              />
            </Field>
            <Field label="Stock" error={fieldErrors.stock}>
              <input
                type="number" min="0"
                value={modal.form.stock}
                onChange={(e) => setField('stock', e.target.value)}
                style={inputStyleWithError(fieldErrors.stock)}
                aria-invalid={!!fieldErrors.stock}
              />
            </Field>
            <Field label="Stock mínimo" error={fieldErrors.stock_minimo}>
              <input
                type="number" min="0"
                value={modal.form.stock_minimo}
                onChange={(e) => setField('stock_minimo', e.target.value)}
                style={inputStyleWithError(fieldErrors.stock_minimo)}
                aria-invalid={!!fieldErrors.stock_minimo}
              />
            </Field>
          </div>
          <div className="form-grid-2">
            <Field label="Categoría" required error={fieldErrors.id_categoria}>
              <select
                value={modal.form.id_categoria}
                onChange={(e) => setField('id_categoria', e.target.value)}
                style={inputStyleWithError(fieldErrors.id_categoria)}
                aria-invalid={!!fieldErrors.id_categoria}
              >
                <option value="">— elegir —</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Marca" required error={fieldErrors.id_marca}>
              <select
                value={modal.form.id_marca}
                onChange={(e) => setField('id_marca', e.target.value)}
                style={inputStyleWithError(fieldErrors.id_marca)}
                aria-invalid={!!fieldErrors.id_marca}
              >
                <option value="">— elegir —</option>
                {marcas.map((m) => (
                  <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button type="button" onClick={closeModal} style={formStyles.ghostBtn}>Cancelar</button>
            <button type="submit" disabled={submitting} style={formStyles.primaryBtn}>
              {submitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 22,
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h2 style={{ color: palette.primary, margin: '0 0 4px' }}>{title}</h2>
        {subtitle && <div style={{ color: palette.textSoft, fontSize: '0.9rem' }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={formStyles.label}>
        {label}{required && <span style={{ color: palette.primary }}> *</span>}
      </label>
      {children}
      {error && (
        <div
          role="alert"
          style={{
            color: '#B22222',
            fontSize: '0.78rem',
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function inputStyleWithError(error) {
  return {
    ...formStyles.input,
    border: error ? '1px solid #D4574A' : formStyles.input.border,
    background: error ? '#FFF5F5' : formStyles.input.background,
  };
}

const tableCardStyle = {
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 4px 18px rgba(199, 21, 133, 0.06)',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
};

function Th({ children, align }) {
  return (
    <th
      style={{
        textAlign: align ?? 'left',
        padding: '12px 14px',
        background: palette.bg,
        color: palette.textSoft,
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align, mono, colSpan }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        textAlign: align ?? 'left',
        padding: '12px 14px',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : 'inherit',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  );
}

const linkBtn = {
  background: 'transparent',
  border: 'none',
  color: palette.primary,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem',
  padding: '4px 8px',
  marginRight: 4,
};
