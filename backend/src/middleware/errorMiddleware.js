/**
 * Manejo global y amigable de errores
 * Requisito Sección 40: "No mostrar errores técnicos incomprensibles a la usuaria"
 */
export function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);

  const statusCode = err.statusCode || 500;
  const message = err.clientMessage || err.message || 'No pudimos completar la operación. Intentá nuevamente.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { errorDebug: err.stack } : {})
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'El recurso solicitado no fue encontrado.'
  });
}

export default {
  errorHandler,
  notFoundHandler
};
