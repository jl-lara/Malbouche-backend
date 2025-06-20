// backend/jobs/scheduler.js
import schedule from 'node-schedule';
import { db } from '../firebase.js';
import { ejecutarMovimiento } from '../utils/arduino.js';

const dayMap = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 };

function programarEvento(id, event) {
  const dias = Object.entries(event.days || {})
    .filter(([_, activo]) => activo)
    .map(([dia]) => dayMap[dia]);

  const [hora, minuto] = event.startTime.split(':').map(Number);

  const regla = new schedule.RecurrenceRule();
  regla.dayOfWeek = dias;
  regla.hour = hora;
  regla.minute = minuto;

  schedule.scheduleJob(id, regla, () => {
    console.log(`🕒 Ejecutando evento: ${event.eventName}`);
    ejecutarMovimiento(event);
  });
}

function cargarEventos() {
  db.ref('events').once('value').then(snapshot => {
    const eventos = snapshot.val() || {};
    for (const [id, evento] of Object.entries(eventos)) {
      programarEvento(id, evento);
    }
  });
}

cargarEventos();