// Reglas de validación del lado del cliente.
// Cada validador devuelve un objeto { campo: 'mensaje' }. Vacío = válido.

export function validateProducto({ sku, nombre, precio, stock, stock_minimo, id_categoria, id_marca }) {
  const errors = {};
  if (!sku || sku.trim().length < 3) errors.sku = 'SKU mínimo 3 caracteres';
  if (!nombre || nombre.trim().length < 2) errors.nombre = 'Nombre requerido';

  const precioNum = Number(precio);
  if (precio === '' || precio === null || precio === undefined || Number.isNaN(precioNum) || precioNum <= 0) {
    errors.precio = 'Precio debe ser mayor a 0';
  }

  const stockNum = Number(stock);
  if (stock === '' || stock === null || stock === undefined || Number.isNaN(stockNum) || stockNum < 0) {
    errors.stock = 'Stock debe ser >= 0';
  }

  const minNum = Number(stock_minimo);
  if (stock_minimo !== '' && stock_minimo !== null && stock_minimo !== undefined) {
    if (Number.isNaN(minNum) || minNum < 0) {
      errors.stock_minimo = 'Stock mínimo debe ser >= 0';
    } else if (!Number.isNaN(stockNum) && minNum > stockNum) {
      errors.stock_minimo = 'No puede ser mayor al stock actual';
    }
  }

  if (!id_categoria) errors.id_categoria = 'Seleccioná una categoría';
  if (!id_marca) errors.id_marca = 'Seleccioná una marca';

  return errors;
}

export function validateCliente({ nombres, apellidos, nit, email, telefono }) {
  const errors = {};
  if (!nombres || nombres.trim().length < 2) errors.nombres = 'Nombres requeridos';
  if (!apellidos || apellidos.trim().length < 2) errors.apellidos = 'Apellidos requeridos';

  if (nit && nit.trim()) {
    // NIT GT: dígitos o letras, longitud razonable (entre 2 y 13 chars).
    const nitClean = nit.trim().toUpperCase();
    if (!/^[0-9A-Z-]{2,13}$/.test(nitClean)) {
      errors.nit = 'NIT inválido (sólo letras, dígitos y guiones)';
    }
  }

  if (email && email.trim()) {
    // Validación simple, suficiente para UI.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Email inválido';
    }
  }

  if (telefono && telefono.trim()) {
    const t = telefono.replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(t)) {
      errors.telefono = 'Teléfono inválido (7–15 dígitos, opcional +)';
    }
  }

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
