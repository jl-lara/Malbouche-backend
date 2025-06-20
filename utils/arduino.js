export function ejecutarMovimiento(evento) {
  console.log(`🔧 Enviando a Arduino:
    Tipo: ${evento.moveType}
    Velocidad: ${evento.speed}
    Duración: ${evento.durationSec} segundos
  `);

  // Aquí podrías abrir conexión serial, enviar comandos reales, etc.
}
