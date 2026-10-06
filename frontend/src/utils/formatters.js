/**
 * Utilidades de Formateo para ControlAR v1.0
 * Adaptado a moneda y usos de Argentina
 */

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatQuantity(quantity, unit = 'Unidad') {
  const q = Number(quantity) || 0;
  const isInteger = q % 1 === 0;
  const formattedNumber = isInteger ? q.toString() : q.toLocaleString('es-AR', { maximumFractionDigits: 3 });

  switch (unit) {
    case 'Gramo':
      return `${formattedNumber} g`;
    case 'Kilogramo':
      return `${formattedNumber} kg`;
    case 'Mililitro':
      return `${formattedNumber} ml`;
    case 'Litro':
      return `${formattedNumber} L`;
    case 'Unidad':
    default:
      return `${formattedNumber} ${q === 1 ? 'unidad' : 'unidades'}`;
  }
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Cálculo del precio de góndola para preview en frontend:
 * Precio = Costo real / (1 - Margen/100)
 */
export function calculateGondolaPreview(costoReal, margenGanancia) {
  const costo = Number(costoReal);
  const margen = Number(margenGanancia);

  if (isNaN(costo) || costo <= 0) return 0;
  if (isNaN(margen) || margen < 0 || margen >= 100) return 0;

  const precio = costo / (1 - (margen / 100));
  return Math.round(precio * 100) / 100;
}
