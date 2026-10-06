import { listarActividad } from '../services/actividadService.js';

export async function getActividad(req, res, next) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const items = await listarActividad({ limit, offset });

    res.json({
      success: true,
      total: items.length,
      actividad: items
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getActividad
};
