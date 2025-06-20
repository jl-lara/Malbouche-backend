import { db } from '../firebase.js';

export async function getAllEvents(req, res) {
  try {
    const snapshot = await db.ref('events').once('value');
    res.json(snapshot.val());
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos', details: err.message });
  }
}

export async function createEvent(req, res) {
  try {
    const newRef = db.ref('events').push();
    await newRef.set(req.body);
    res.status(201).json({ message: 'Evento creado', id: newRef.key });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear evento', details: err.message });
  }
}
