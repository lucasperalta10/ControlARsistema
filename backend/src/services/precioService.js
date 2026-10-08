/**
 * Servicio de Cálculo de Precios para ControlAR v1.0
 * Victoria Productos Artesanales
 * 
 * Regla oficial del negocio:
 *   Precio de mostrador = Precio de compra (costo con IVA) × (1 + Porcentaje de ganancia / 100)
 * 
 * El porcentaje representa un recargo sobre el costo, no un margen sobre el precio de venta.
 * 
 * Restricciones:
 *   - Precio de compra / Costo real >= 0
 *   - Porcentaje de ganancia o recargo >= 0
 */

export function calcularPrecioMostrador(costoReal, margenGanancia) {
  const costo = Number(costoReal);
  const porcentaje = Number(margenGanancia);

  if (isNaN(costo) || costo < 0) {
    throw new Error('El precio de compra no puede ser negativo.');
  }

  if (isNaN(porcentaje) || porcentaje < 0) {
    throw new Error('El porcentaje de ganancia o recargo debe ser mayor o igual a 0%.');
  }

  if (costo === 0) {
    return 0;
  }

  const factorRecargo = 1 + (porcentaje / 100);
  const precio = costo * factorRecargo;

  // Redondeo estándar a 2 decimales para precisión interna
  return Math.round(precio * 100) / 100;
}

// Alias de retrocompatibilidad con la arquitectura previa
export const calcularPrecioGondola = calcularPrecioMostrador;

export function calcularCostoRealConIva(precioCompra) {
  const compra = Number(precioCompra);
  if (isNaN(compra) || compra <= 0) return 0;
  return Math.round(compra * 1.21 * 100) / 100;
}

export function validarDatosPrecio(costoReal, margenGanancia, precioCompra = 0) {
  const errors = [];
  const costo = Number(costoReal);
  const margen = Number(margenGanancia);
  const compra = Number(precioCompra);

  if (!isNaN(compra) && compra < 0) {
    errors.push('El precio de compra no puede ser negativo.');
  }

  if (isNaN(costo) || costo < 0) {
    errors.push('El costo real o precio de compra no puede ser negativo.');
  }

  if (isNaN(margen) || margen < 0) {
    errors.push('El porcentaje de ganancia o recargo debe ser mayor o igual a 0%.');
  } else if (margen > 999.99) {
    errors.push('El porcentaje de ganancia o recargo no puede exceder 999.99%.');
  }

  return {
    valido: errors.length === 0,
    errores: errors
  };
}

export default {
  calcularPrecioMostrador,
  calcularPrecioGondola,
  calcularCostoRealConIva,
  validarDatosPrecio
};
