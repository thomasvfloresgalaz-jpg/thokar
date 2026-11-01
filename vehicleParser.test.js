const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVehicleText, parseRows, sanitizeVehicle } = require('../backend/vehicleParser');

test('extrae solo campos técnicos y omite datos personales', () => {
  const text = `Información del propietario\nNombre completo: PERSONA EJEMPLO\nRUT: 11.111.111-1\nInformación Vehicular\nPatente: ABCD12\nMarca: TOYOTA\nModelo: YARIS\nAño: 2009\nColor: GRIS\nN° Motor: 1NZ1234567\nN° Chasis: JTDBT923X01234567\nProcedencia: JAPON\nFabricante: TOYOTA`;
  const got = parseVehicleText(text);
  assert.equal(got.marca, 'TOYOTA');
  assert.equal(got.modelo, 'YARIS');
  assert.equal(got.anio, '2009');
  assert.equal(got.motor, '1NZ1234567');
  assert.equal(got.chasis, 'JTDBT923X01234567');
  assert.equal(got.nombre, undefined);
  assert.equal(got.rut, undefined);
});

test('extrae pares desde filas de tabla', () => {
  const got = parseRows([
    ['Marca', 'KIA'], ['Modelo', 'RIO 5'], ['Año', '2016'], ['RUT', '1-9'], ['Color', 'BLANCO']
  ]);
  assert.deepEqual(got, { marca: 'KIA', modelo: 'RIO 5', anio: '2016', color: 'BLANCO' });
});

test('sanitizeVehicle fuerza la patente solicitada y lista blanca', () => {
  const got = sanitizeVehicle({ marca: 'NISSAN', modelo: 'VERSA', propietario: 'NO GUARDAR' }, 'abcd12');
  assert.equal(got.plate, 'ABCD12');
  assert.equal(got.marca, 'NISSAN');
  assert.equal(got.propietario, undefined);
});
