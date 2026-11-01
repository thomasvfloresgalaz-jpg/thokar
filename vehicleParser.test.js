const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVehicleText, parseRows, sanitizeVehicle } = require('./vehicleParser');

test('extrae ficha vehicular aunque el propietario esté en la misma página', () => {
  const text = `Información del propietario\nNombre completo\nPERSONA EJEMPLO\nRUT\n11.111.111-1\nInformación Vehicular\nPatente\nABCD12\nTipo\nAUTOMOVIL\nMarca\nTOYOTA\nModelo\nYARIS\nAño\n2009\nColor\nGRIS\nN° Motor\n1NZ1234567\nN° Chasis\nJTDBT923X01234567\nProcedencia\nJAPON\nFabricante\nTOYOTA`;
  const got = parseVehicleText(text);
  assert.equal(got.marca, 'TOYOTA');
  assert.equal(got.modelo, 'YARIS');
  assert.equal(got.anio, '2009');
  assert.equal(got.motor, '1NZ1234567');
  assert.equal(got.chasis, 'JTDBT923X01234567');
  assert.equal(got.nombre, undefined);
  assert.equal(got.rut, undefined);
});

test('extrae formatos en línea y antecedentes administrativos', () => {
  const text = `Marca: KIA\nModelo RIO 5\nAño 2016\nTipo de combustible Gasolina\nMultas de tránsito: 0\nMes revisión técnica: SEPTIEMBRE\nRevisión técnica: APROBADA\nSOAP: VIGENTE\nRestricción vehicular: SIN RESTRICCIÓN`;
  const got = parseVehicleText(text);
  assert.equal(got.marca, 'KIA');
  assert.equal(got.modelo, 'RIO 5');
  assert.equal(got.anio, '2016');
  assert.equal(got.combustible, 'Gasolina');
  assert.equal(got.multas, '0');
  assert.equal(got.revisionTecnica, 'APROBADA');
  assert.equal(got.soap, 'VIGENTE');
});

test('extrae pares desde filas y descarta identidad del propietario', () => {
  const got = parseRows([
    ['Marca', 'NISSAN'],
    ['Modelo', 'VERSA'],
    ['Nombre', 'PERSONA EJEMPLO'],
    ['RUT', '1-9'],
    ['Tipo de sello', 'VERDE'],
    ['Permiso de circulación', 'VIGENTE']
  ]);
  assert.equal(got.marca, 'NISSAN');
  assert.equal(got.modelo, 'VERSA');
  assert.equal(got.tipoSello, 'VERDE');
  assert.equal(got.permisoCirculacion, 'VIGENTE');
  assert.equal(got.nombre, undefined);
  assert.equal(got.rut, undefined);
});

test('sanitizeVehicle fuerza patente y mantiene solo lista blanca', () => {
  const got = sanitizeVehicle({ marca: 'NISSAN', modelo: 'VERSA', propietario: 'NO GUARDAR', rut: '1-9' }, 'abcd12');
  assert.equal(got.plate, 'ABCD12');
  assert.equal(got.marca, 'NISSAN');
  assert.equal(got.propietario, undefined);
  assert.equal(got.rut, undefined);
});
