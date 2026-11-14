const SEXOS = ['M', 'F'];
const ESTADOS_RELACION = ['soltero', 'noviazgo', 'casado', 'union_libre', 'divorciado', 'viudo'];
const CANALES = ['correo', 'whatsapp', 'sms', 'llamada'];

function fechaValida(valor, permitirFutura = false) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) return false;
  const hoy = new Date().toISOString().slice(0, 10);
  return permitirFutura || valor <= hoy;
}

function horaValida(valor) {
  return typeof valor === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

function enteroPositivo(valor) {
  return (typeof valor === 'number' || (typeof valor === 'string' && /^\d+$/.test(valor))) &&
    Number.isInteger(Number(valor)) && Number(valor) > 0;
}

function validarPersona(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['el cuerpo de la solicitud debe ser un objeto JSON'];
  }
  const errores = [];
  const obligatorios = [
    'nombres', 'apellidos', 'fecha_nacimiento', 'sexo', 'telefono',
    'estado_relacion', 'fecha_ingreso', 'cargo_id', 'canal_preferido', 'consentimiento'
  ];

  for (const campo of obligatorios) {
    if (datos[campo] === undefined || datos[campo] === null || datos[campo] === '') {
      errores.push(`el campo ${campo} es obligatorio`);
    }
  }
  if (datos.sexo !== undefined && !SEXOS.includes(datos.sexo)) errores.push('sexo debe ser M o F');
  if (datos.estado_relacion !== undefined && !ESTADOS_RELACION.includes(datos.estado_relacion)) {
    errores.push('estado_relacion no es válido');
  }
  if (datos.canal_preferido !== undefined && !CANALES.includes(datos.canal_preferido)) {
    errores.push('canal_preferido no es válido');
  }
  for (const campo of ['fecha_nacimiento', 'fecha_ingreso']) {
    if (datos[campo] !== undefined && !fechaValida(datos[campo])) {
      errores.push(`${campo} debe ser una fecha válida YYYY-MM-DD y no futura`);
    }
  }
  if (datos.cedula !== undefined && datos.cedula !== null && datos.cedula !== '' &&
      (typeof datos.cedula !== 'string' || !/^\d{10}$/.test(datos.cedula))) {
    errores.push('cedula debe contener exactamente 10 dígitos');
  }
  if (datos.correo && (typeof datos.correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo))) {
    errores.push('correo debe tener un formato válido');
  }
  if (datos.canal_preferido === 'correo' && !datos.correo) {
    errores.push('correo es obligatorio cuando canal_preferido es correo');
  }
  if (datos.estado_relacion === 'casado') {
    if (!fechaValida(datos.fecha_matrimonio)) {
      errores.push('fecha_matrimonio es obligatoria y debe ser válida cuando estado_relacion es casado');
    }
  } else if (datos.fecha_matrimonio) {
    errores.push('fecha_matrimonio solo aplica cuando estado_relacion es casado');
  }
  if (datos.cargo_id !== undefined && !enteroPositivo(datos.cargo_id)) errores.push('cargo_id debe ser un entero positivo');
  if (typeof datos.consentimiento !== 'boolean' || datos.consentimiento !== true) {
    errores.push('se requiere consentimiento informado');
  }
  for (const [campo, maximo] of [['nombres', 100], ['apellidos', 100], ['telefono', 15]]) {
    if (datos[campo] !== undefined &&
        (typeof datos[campo] !== 'string' || !datos[campo].trim() || datos[campo].length > maximo)) {
      errores.push(`${campo} debe ser texto no vacío de máximo ${maximo} caracteres`);
    }
  }
  if (datos.correo !== undefined && datos.correo !== null && datos.correo !== '' &&
      (typeof datos.correo !== 'string' || datos.correo.length > 150)) {
    errores.push('correo no puede superar 150 caracteres');
  }
  if (datos.sexo !== undefined && typeof datos.sexo !== 'string') errores.push('sexo debe ser texto');
  if (datos.estado_relacion !== undefined && typeof datos.estado_relacion !== 'string') {
    errores.push('estado_relacion debe ser texto');
  }
  if (datos.canal_preferido !== undefined && typeof datos.canal_preferido !== 'string') {
    errores.push('canal_preferido debe ser texto');
  }
  return errores;
}

function validarHijos(hijos) {
  const errores = [];
  if (hijos === undefined) return errores;
  if (!Array.isArray(hijos)) return ['hijos debe ser una lista'];
  hijos.forEach((hijo, indice) => {
    if (!hijo || typeof hijo !== 'object' || Array.isArray(hijo)) {
      errores.push(`hijos[${indice}] debe ser un objeto`);
      return;
    }
    if (typeof hijo.nombre !== 'string' || !hijo.nombre.trim() || hijo.nombre.length > 100) {
      errores.push(`hijos[${indice}].nombre es obligatorio y no debe superar 100 caracteres`);
    }
    if (!fechaValida(hijo.fecha_nacimiento)) {
      errores.push(`hijos[${indice}].fecha_nacimiento debe ser válida y no futura`);
    }
  });
  return errores;
}

function validarMinisterios(ministerios) {
  if (ministerios === undefined) return [];
  if (!Array.isArray(ministerios)) return ['ministerios debe ser una lista de identificadores'];
  const errores = [];
  ministerios.forEach((id, indice) => {
    if (!enteroPositivo(id)) errores.push(`ministerios[${indice}] debe ser un entero positivo`);
  });
  if (new Set(ministerios.map(Number)).size !== ministerios.length) {
    errores.push('ministerios no debe contener identificadores repetidos');
  }
  return errores;
}

module.exports = {
  CANALES,
  ESTADOS_RELACION,
  SEXOS,
  enteroPositivo,
  fechaValida,
  horaValida,
  validarHijos,
  validarMinisterios,
  validarPersona
};
