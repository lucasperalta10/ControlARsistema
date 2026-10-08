/**
 * Servicio de Cálculo de Precios para ControlAR v1.0
 * 
 * Regla oficial del negocio:
 *   Precio de góndola = Costo real (21% IVA incluido) / (1 - (Margen / 100))
 * 
 * Restricciones:
 *   - Margen >= 0 y Margen < 100
 *   - Costo real >= 0
 */

export function calcularPrecioGondola(costoReal, margenGanancia) {
  const costo = Number(costoReal);
  const margen = Number(margenGanancia);

  if (isNaN(costo) || costo < 0) {
    throw new Error('El costo real debe ser un número mayor o igual a 0.');
  }

  if (isNaN(margen) || margen < 0 || margen >= 100) {
    throw new Error('El margen de ganancia debe ser mayor o igual a 0% y menor a 100%.');
  }

  if (costo === 0) {
    return 0;
  }

  const factorMargen = 1 - (margen / 100);
  const precio = costo / factorMargen;

  // Redondeo estándar a 2 decimales para precisión interna
  return Math.round(precio * 100) / 100;
}

export function calcularCostoRealConIva(precioCompra) {
  const compra = Number(precioCompra);
  if (isNaN(compra) || compra <= 0) return 0;
  return Math.round(compra * 1.21 * 100) / 100;
}

export function validarDatosPrecio(costoReal, margenGanancia, precioCompra) {
  const errors = [];
  const costo = Number(costoReal);
  const margen = Number(margenGanancia);
  const compra = Number(precioCompra);

  if (isNaN(compra) || compra < 0) {
    errors.push('El precio de compra no puede ser negativo.');
  }

  if (isNaN(costo) || costo < 0) {
    errors.push('El costo real no puede ser negativo.');
  }

  if (isNaN(margen) || margen < 0 || margen >= 100) {
    errors.push('El margen de ganancia debe estar entre 0% y 99.99%.');
  }

  return {
    valido: errors.length === 0,
    errores: errors
  };
}

export default {
  calcularPrecioGondola,
  calcularCostoRealConIva,
  validarDatosPrecio
};
