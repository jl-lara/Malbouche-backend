#include <WiFi.h>
#include <WebServer.h>
#include <time.h>
#include <Wire.h>

// --- Configuración WiFi ---
const char* ssid = "4-D";
const char* password = "nachosconqueso";

// --- Pines motores 28BYJ-48 ---
const int motorHoras[4] = {14, 27, 26, 25};
const int motorMin[4] = {19, 18, 5, 4};

// --- Secuencia medio paso ---
const int steps[8][4] = {
  {1,0,0,0},
  {1,1,0,0},
  {0,1,0,0},
  {0,1,1,0},
  {0,0,1,0},
  {0,0,1,1},
  {0,0,0,1},
  {1,0,0,1}
};

WebServer server(80);

// --- Parámetros reloj ---
const int pasosPorVuelta = 512;
const int pasosPorHora = pasosPorVuelta / 12;     // ~42.6
const int pasosPorMinuto = pasosPorVuelta / 60;   // ~8.53

// Variables de estado
enum Modo { STOP, LEFT, RIGHT, CRAZY, NORMAL, SWING };
Modo modoActual = STOP;

// Posiciones actuales de pasos
int posHoras = 0;
int posMin = 0;

// Índices de paso para la secuencia medio paso (para mover motores)
int stepIndexHoras = 0;
int stepIndexMin = 0;

// Para control de avance automático en modo NORMAL
unsigned long ultimoAvance = 0;
const unsigned long intervaloAvanceMs = 1000; // cada segundo avanzamos segundos

// Para modo SWING
bool swingSentido = true;
unsigned long swingUltimoMovimiento = 0;
const unsigned long swingIntervalo = 500; // 0.5 segundos

// Velocidad (delay ms) entre pasos, default 2 ms
int velocidadPaso = 2;

// --- Variables para movimiento personalizado ---
bool movimientoPersonalizadoActivo = false;
unsigned long inicioMovimientoPersonalizado = 0;
unsigned long duracionMovimientoPersonalizado = 0;
String dirHorasPersonalizado = "derecha";
String dirMinutosPersonalizado = "derecha";
int velHorasPersonalizado = 50;
int velMinutosPersonalizado = 50;

// --- Declaración funciones motores ---
void girarUnPaso(const int motorPins[4], int &stepIndex, bool sentidoHorario);
void moverPasos(const int motorPins[4], int &stepIndex, int pasos, bool sentidoHorario);
void moverMotorVelocidad(const int motorPins[4], int &stepIndex, int direccion, int velocidad);
void apagarMotor(const int motorPins[4]);
void sincronizarHoraReal();

// --- Funciones helper para parsear JSON ---
String extraerValorJSON(String json, String clave) {
  int inicio = json.indexOf("\"" + clave + "\":");
  if (inicio == -1) return "";
  
  inicio = json.indexOf(":", inicio) + 1;
  while (inicio < json.length() && (json.charAt(inicio) == ' ' || json.charAt(inicio) == '\t')) inicio++;
  
  if (json.charAt(inicio) == '"') {
    // Valor string
    inicio++;
    int fin = json.indexOf("\"", inicio);
    return json.substring(inicio, fin);
  } else {
    // Valor numérico
    int fin = inicio;
    while (fin < json.length() && (isDigit(json.charAt(fin)) || json.charAt(fin) == '.')) fin++;
    return json.substring(inicio, fin);
  }
}

String extraerObjetoJSON(String json, String clave) {
  String buscar = "\"" + clave + "\":{";
  int inicio = json.indexOf(buscar);
  if (inicio == -1) return "";
  
  inicio += buscar.length() - 1; // Incluir la llave de apertura
  int contadorLlaves = 1;
  int pos = inicio + 1;
  
  while (pos < json.length() && contadorLlaves > 0) {
    if (json.charAt(pos) == '{') contadorLlaves++;
    else if (json.charAt(pos) == '}') contadorLlaves--;
    pos++;
  }
  
  return json.substring(inicio, pos);
}

void setup() {
  Serial.begin(115200);

  // Configurar pines motores
  for (int i=0; i<4; i++) {
    pinMode(motorHoras[i], OUTPUT);
    pinMode(motorMin[i], OUTPUT);
    digitalWrite(motorHoras[i], LOW);
    digitalWrite(motorMin[i], LOW);
  }

  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi...");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado!");
  Serial.println("=== INFORMACIÓN DE RED ===");
  Serial.print("IP asignada: ");
  Serial.println(WiFi.localIP());
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("Intensidad de señal: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.println("==========================");

  // Configurar NTP (GMT -6 sin horario verano)
  configTzTime("PST8PDT", "pool.ntp.org", "time.nist.gov");

  // Rutas servidor web
  server.on("/", []() {
    String html = "<h1>Reloj 28BYJ-48 ESP32</h1>";
    html += "<p>Modos disponibles: /left /right /crazy /normal /stop /swing</p>";
    html += "<p>Ajustar velocidad: /speed?value=1-100</p>";
    html += "<p>Movimiento personalizado: POST /custom con JSON</p>";
    html += "<p>Ping: /ping</p>";
    server.send(200, "text/html", html);
  });

  server.on("/left", [](){
    modoActual = LEFT;
    server.send(200, "text/plain", "Modo LEFT activado");
    Serial.println("Modo LEFT activado");
  });

  server.on("/right", [](){
    modoActual = RIGHT;
    server.send(200, "text/plain", "Modo RIGHT activado");
    Serial.println("Modo RIGHT activado");
  });

  server.on("/crazy", [](){
    modoActual = CRAZY;
    server.send(200, "text/plain", "Modo CRAZY activado");
    Serial.println("Modo CRAZY activado");
  });

  server.on("/normal", [](){
    sincronizarHoraReal(); // sincroniza al cambiar a modo normal
    modoActual = NORMAL;
    server.send(200, "text/plain", "Modo NORMAL activado");
    Serial.println("Modo NORMAL activado");
  });

  server.on("/stop", [](){
    modoActual = STOP;
    apagarMotor(motorHoras);
    apagarMotor(motorMin);
    server.send(200, "text/plain", "Motores detenidos");
    Serial.println("Motores detenidos");
  });

  server.on("/swing", [](){
    modoActual = SWING;
    server.send(200, "text/plain", "Modo SWING activado");
    Serial.println("Modo SWING activado");
  });

  // Endpoint de ping para pruebas
  server.on("/ping", [](){
    server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Arduino ESP32 funcionando\"}");
    Serial.println("Ping recibido");
  });

  // Ruta para ajustar velocidad
  server.on("/speed", []() {
    if (server.hasArg("value")) {
      int val = server.arg("value").toInt();
      if (val < 1) val = 1;
      if (val > 100) val = 100;
      // Mapear valor 1-100 a delay 10-1 ms (velocidad inversa)
      velocidadPaso = map(val, 1, 100, 10, 1);
      server.send(200, "text/plain", "Velocidad ajustada a " + String(val));
      Serial.printf("Velocidad paso ajustada a %d (delay ms: %d)\n", val, velocidadPaso);
    } else {
      server.send(400, "text/plain", "Falta parámetro value");
    }
  });

  // Ruta para movimiento personalizado
  server.on("/custom", HTTP_POST, [](){
    if (server.hasArg("plain")) {
      String body = server.arg("plain");
      
      Serial.println("=== MOVIMIENTO PERSONALIZADO RECIBIDO ===");
      Serial.println(body);
      
      // Extraer valores generales
      String nombre = extraerValorJSON(body, "nombre");
      if (nombre == "") nombre = "Movimiento personalizado";
      
      String direccionGeneral = extraerValorJSON(body, "direccionGeneral");
      String velocidadGeneral = extraerValorJSON(body, "velocidadGeneral");
      
      // Extraer movimiento.horas
      String movimientoJSON = extraerObjetoJSON(body, "movimiento");
      String dirHorasJSON = extraerObjetoJSON(movimientoJSON, "horas");
      dirHorasPersonalizado = extraerValorJSON(dirHorasJSON, "direccion");
      if (dirHorasPersonalizado == "") dirHorasPersonalizado = direccionGeneral != "" ? direccionGeneral : "derecha";
      
      String velHorasStr = extraerValorJSON(dirHorasJSON, "velocidad");
      velHorasPersonalizado = (velHorasStr == "") ? (velocidadGeneral != "" ? velocidadGeneral.toInt() : 50) : velHorasStr.toInt();
      
      // Extraer movimiento.minutos
      String dirMinutosJSON = extraerObjetoJSON(movimientoJSON, "minutos");
      dirMinutosPersonalizado = extraerValorJSON(dirMinutosJSON, "direccion");
      if (dirMinutosPersonalizado == "") dirMinutosPersonalizado = direccionGeneral != "" ? direccionGeneral : "derecha";
      
      String velMinutosStr = extraerValorJSON(dirMinutosJSON, "velocidad");
      velMinutosPersonalizado = (velMinutosStr == "") ? (velocidadGeneral != "" ? velocidadGeneral.toInt() : 50) : velMinutosStr.toInt();
      
      String duracionStr = extraerValorJSON(body, "duracion");
      int duracionSeg = (duracionStr == "") ? 60 : duracionStr.toInt();
      
      // Validar valores
      velHorasPersonalizado = constrain(velHorasPersonalizado, 1, 100);
      velMinutosPersonalizado = constrain(velMinutosPersonalizado, 1, 100);
      duracionSeg = constrain(duracionSeg, 1, 300);
      
      Serial.printf("Ejecutando: %s\n", nombre.c_str());
      Serial.printf("Horas: %s a velocidad %d\n", dirHorasPersonalizado.c_str(), velHorasPersonalizado);
      Serial.printf("Minutos: %s a velocidad %d\n", dirMinutosPersonalizado.c_str(), velMinutosPersonalizado);
      Serial.printf("Duración: %d segundos\n", duracionSeg);
      
      // Detener modo actual
      modoActual = STOP;
      apagarMotor(motorHoras);
      apagarMotor(motorMin);
      
      // Configurar movimiento personalizado
      duracionMovimientoPersonalizado = duracionSeg * 1000;
      inicioMovimientoPersonalizado = millis();
      movimientoPersonalizadoActivo = true;
      
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Movimiento personalizado iniciado\"}");
      Serial.println("Movimiento personalizado iniciado");
      
    } else {
      server.send(400, "application/json", "{\"success\":false,\"error\":\"No se recibieron datos\"}");
    }
  });

  server.begin();
}

void loop() {
  server.handleClient(); // Priorizar manejo de cliente HTTP
  
  unsigned long ahora = millis();
  
  switch(modoActual) {
    case LEFT:
      // LEFT: Ambas manecillas deben ir a la izquierda
      // Invertimos la dirección del motor de horas ya que actualmente va a la derecha
      girarUnPaso(motorHoras, stepIndexHoras, true); // Ahora va a la izquierda
      delay(max(1, velocidadPaso));
      girarUnPaso(motorMin, stepIndexMin, true); // Ya va a la izquierda, no cambiamos
      delay(max(1, velocidadPaso));
      break;

    case RIGHT:
      // RIGHT: Ambas manecillas deben ir a la derecha
      // Invertimos las direcciones de ambos motores
      girarUnPaso(motorHoras, stepIndexHoras, false); // Ahora va a la derecha
      delay(max(1, velocidadPaso));
      girarUnPaso(motorMin, stepIndexMin, false); // Ahora va a la derecha
      delay(max(1, velocidadPaso));
      break;

    case CRAZY:
      // CRAZY: Las manecillas deben ir en sentidos opuestos
      // Una manecilla va a la izquierda, la otra a la derecha
      girarUnPaso(motorHoras, stepIndexHoras, true); // Horas a la derecha
      delay(max(1, velocidadPaso));
      girarUnPaso(motorMin, stepIndexMin, false); // Minutos a la izquierda
      delay(max(1, velocidadPaso));
      break;

    case NORMAL:
      {
        unsigned long now = millis();
        if (now - ultimoAvance >= intervaloAvanceMs) {
          ultimoAvance = now;

          struct tm timeinfo;
          if (getLocalTime(&timeinfo)) {
            int hora = timeinfo.tm_hour % 12;
            int minuto = timeinfo.tm_min;

            int pasosHoraEsperado = hora * pasosPorHora + (minuto * pasosPorHora / 60);
            int pasosMinutoEsperado = minuto * pasosPorMinuto;

            int deltaHoras = pasosHoraEsperado - posHoras;
            if (deltaHoras != 0) {
              bool dirHoras = (deltaHoras > 0);
              // Para sincronizar correctamente, invertimos la dirección para el motor de horas
              moverPasos(motorHoras, stepIndexHoras, abs(deltaHoras), dirHoras);
              posHoras = pasosHoraEsperado;
            }

            int deltaMinutos = pasosMinutoEsperado - posMin;
            if (deltaMinutos != 0) {
              bool dirMin = (deltaMinutos > 0);
              // Para sincronizar correctamente, también invertimos la dirección para los minutos
              moverPasos(motorMin, stepIndexMin, abs(deltaMinutos), dirMin);
              posMin = pasosMinutoEsperado;
            }
          } else {
            Serial.println("No se pudo obtener hora NTP");
          }
        }
      }
      break;

    // En el modo SWING, corregir la llamada a moverPasos() que falta un argumento
    case SWING:
      {
        static bool sentido = true;
        static unsigned long lastMove = 0;
        const unsigned long intervalo = 100;
        if (millis() - lastMove > intervalo) {
          moverPasos(motorHoras, stepIndexHoras, 5, sentido);
          moverPasos(motorMin, stepIndexMin, 5, sentido); // Corregido: añadido el argumento 5 para pasos
          sentido = !sentido;
          lastMove = millis();
        }
      }
      break;

    case STOP:
      apagarMotor(motorHoras);
      apagarMotor(motorMin);
      delay(10); // Reducir delay para mejor responsividad
      break;
  }

  // --- Manejo de movimiento personalizado ---
  if (movimientoPersonalizadoActivo) {
    // Verificar si el tiempo de movimiento personalizado ha terminado
    if (millis() - inicioMovimientoPersonalizado >= duracionMovimientoPersonalizado) {
      movimientoPersonalizadoActivo = false;
      apagarMotor(motorHoras);
      apagarMotor(motorMin);
      Serial.println("Movimiento personalizado completado");
    } else {
      // Ejecutar movimiento personalizado para horas
      // Ajustamos la dirección según la observación del comportamiento de los motores
      if (dirHorasPersonalizado == "derecha") {
        moverMotorVelocidad(motorHoras, stepIndexHoras, 1, velHorasPersonalizado);
      } else if (dirHorasPersonalizado == "izquierda") {
        moverMotorVelocidad(motorHoras, stepIndexHoras, -1, velHorasPersonalizado);
      }
      
      // Ejecutar movimiento personalizado para minutos
      if (dirMinutosPersonalizado == "derecha") {
        moverMotorVelocidad(motorMin, stepIndexMin, 1, velMinutosPersonalizado);
      } else if (dirMinutosPersonalizado == "izquierda") {
        moverMotorVelocidad(motorMin, stepIndexMin, -1, velMinutosPersonalizado);
      }
    }
  }
}

// --- Función para girar 1 paso ---
void girarUnPaso(const int motorPins[4], int &stepIndex, bool sentidoHorario) {
  stepIndex = sentidoHorario ? (stepIndex + 1) % 8 : (stepIndex + 7) % 8;
  for (int i=0; i<4; i++) {
    digitalWrite(motorPins[i], steps[stepIndex][i]);
  }
}

// --- Función para mover N pasos ---
void moverPasos(const int motorPins[4], int &stepIndex, int pasos, bool sentidoHorario) {
  for (int i=0; i<pasos; i++) {
    girarUnPaso(motorPins, stepIndex, sentidoHorario);
    delay(velocidadPaso);
    
    // Manejar cliente HTTP cada 10 pasos para mantener responsividad
    if (i % 10 == 0) {
      server.handleClient();
    }
  }
}

// --- Función para mover motor con velocidad específica ---
void moverMotorVelocidad(const int motorPins[4], int &stepIndex, int direccion, int velocidad) {
  bool sentidoHorario = (direccion > 0);
  int delayVelocidad = map(velocidad, 1, 100, 20, 1); // Mapear velocidad a delay
  girarUnPaso(motorPins, stepIndex, sentidoHorario);
  delay(delayVelocidad);
}

// --- Apagar motor (todos pines LOW) ---
void apagarMotor(const int motorPins[4]) {
  for (int i=0; i<4; i++) {
    digitalWrite(motorPins[i], LOW);
  }
}

// --- Obtener fecha y hora ---
String obtenerFechaISO() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "";
  char fecha[25];
  strftime(fecha, sizeof(fecha), "%Y-%m-%dT%H:%M:%S.000Z", &timeinfo);
  return String(fecha);
}

String obtenerHoraStr() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "";
  char hora[10];
  strftime(hora, sizeof(hora), "%H:%M:%S", &timeinfo);
  return String(hora);
}

// --- Sincronizar la hora real ---
void sincronizarHoraReal() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("No se pudo obtener hora NTP para sincronizar");
    return;
  }

  int hora = timeinfo.tm_hour % 12;
  int minuto = timeinfo.tm_min;

  int pasosHoraEsperado = hora * pasosPorHora + (minuto * pasosPorHora / 60);
  int pasosMinutoEsperado = minuto * pasosPorMinuto;

  int deltaHoras = pasosHoraEsperado - posHoras;
  int deltaMinutos = pasosMinutoEsperado - posMin;

  if (deltaHoras != 0) {
    bool dirHoras = (deltaHoras > 0);
    moverPasos(motorHoras, stepIndexHoras, abs(deltaHoras), dirHoras);
    posHoras = pasosHoraEsperado;
  }
  if (deltaMinutos != 0) {
    bool dirMin = (deltaMinutos > 0);
    moverPasos(motorMin, stepIndexMin, abs(deltaMinutos), dirMin);
    posMin = pasosMinutoEsperado;
  }

  Serial.printf("Sincronizado a %02d:%02d\n", hora, minuto);
}