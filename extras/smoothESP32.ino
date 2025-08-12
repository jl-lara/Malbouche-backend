#include <WiFi.h>
#include <WebServer.h>
#include <time.h>
#include <Wire.h>
#include <HTTPClient.h>

// --- Configuración WiFi ---
const char* ssid = "4-D";
const char* password = "nachosconqueso";

// --- Variables para consultar comandos del backend ---
unsigned long ultimaConsultaComandos = 0;
const unsigned long intervaloConsultaComandos = 5000; // Consultar cada 5 segundos
bool comandoPendiente = false;
String comandoActual = "";

// --- Variables para HTTP no bloqueante ---
enum EstadoHTTP { 
  HTTP_IDLE,              // Sin operación HTTP en curso
  HTTP_CONSULTANDO,       // Consultando comandos pendientes
  HTTP_ENVIANDO_ACK       // Enviando confirmación de recepción
};
EstadoHTTP estadoHTTP = HTTP_IDLE;
HTTPClient httpClient;
unsigned long inicioHTTP = 0;
const unsigned long timeoutHTTP = 3000; // 3 segundos de timeout

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
void iniciarConsultaComandos();
void manejarConsultaHTTP();
void ejecutarComandoBackend(String comando);

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

// --- SETUP ---
void setup() {
  Serial.begin(115200);
  delay(10);
  
  // Iniciar WiFi
  Serial.println("Conectando a " + String(ssid));
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi conectado - IP: " + WiFi.localIP().toString());
  
  // Configurar pines de motores como salidas
  for(int i = 0; i < 4; i++) {
    pinMode(motorHoras[i], OUTPUT);
    pinMode(motorMin[i], OUTPUT);
  }
  
  // Apagar inicialmente los motores
  apagarMotor(motorHoras);
  apagarMotor(motorMin);
  
  // Configurar NTP para Costa Rica (UTC-6)
  configTime(-6 * 3600, 0, "pool.ntp.org");
  
  // Configurar endpoints del servidor web
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", "<html><body><h1>ESP32 Malbouche v2.0</h1>"
                                 "<p>Estado actual: " + String(modoActual) + "</p>"
                                 "<p><a href='/info'>Ver información</a></p>"
                                 "<h2>Controles</h2>"
                                 "<p><a href='/comando?modo=left'>LEFT</a></p>"
                                 "<p><a href='/comando?modo=right'>RIGHT</a></p>"
                                 "<p><a href='/comando?modo=crazy'>CRAZY</a></p>"
                                 "<p><a href='/comando?modo=swing'>SWING</a></p>"
                                 "<p><a href='/comando?modo=normal'>NORMAL</a></p>"
                                 "<p><a href='/comando?modo=stop'>STOP</a></p>"
                                 "</body></html>");
  });

  server.on("/info", HTTP_GET, []() {
    struct tm timeinfo;
    bool hayHora = getLocalTime(&timeinfo);
    String hora = hayHora ? 
                 String(timeinfo.tm_hour) + ":" + 
                 String(timeinfo.tm_min) + ":" + 
                 String(timeinfo.tm_sec) : "No disponible";
    
    server.send(200, "application/json", 
                "{\"status\":\"ok\","
                "\"espTime\":\"" + hora + "\","
                "\"wifiStrength\":" + String(WiFi.RSSI()) + ","
                "\"modo\":\"" + String(modoActual) + "\","
                "\"uptime\":" + String(millis()/1000) + "}");
  });

  server.on("/comando", HTTP_GET, []() {
    String modo = server.arg("modo");
    
    if (modo == "left") {
      modoActual = LEFT;
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Modo LEFT activado\"}");
    } else if (modo == "right") {
      modoActual = RIGHT;
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Modo RIGHT activado\"}");
    } else if (modo == "crazy") {
      modoActual = CRAZY;
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Modo CRAZY activado\"}");
    } else if (modo == "stop") {
      modoActual = STOP;
      apagarMotor(motorHoras);
      apagarMotor(motorMin);
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Motores detenidos\"}");
    } else if (modo == "normal") {
      modoActual = NORMAL;
      sincronizarHoraReal();
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Modo NORMAL activado\"}");
    } else if (modo == "swing") {
      modoActual = SWING;
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Modo SWING activado\"}");
    } else {
      server.send(400, "application/json", "{\"success\":false,\"error\":\"Modo no válido\"}");
    }
  });

  server.on("/movimiento-personalizado", HTTP_POST, []() {
    String body = server.arg("plain");
    
    if (body != "") {
      String nombre = extraerValorJSON(body, "nombre");
      String direccionGeneral = extraerValorJSON(body, "direccion");
      String velocidadGeneral = extraerValorJSON(body, "velocidad");
      
      // Configurar dirección para las horas
      String dirHorasJSON = extraerValorJSON(body, "horas");
      dirHorasPersonalizado = extraerValorJSON(dirHorasJSON, "direccion");
      if (dirHorasPersonalizado == "") dirHorasPersonalizado = direccionGeneral != "" ? direccionGeneral : "derecha";
      
      String velHorasStr = extraerValorJSON(dirHorasJSON, "velocidad");
      velHorasPersonalizado = (velHorasStr == "") ? (velocidadGeneral != "" ? velocidadGeneral.toInt() : 50) : velHorasStr.toInt();
      
      // Configurar dirección para los minutos
      String dirMinutosJSON = extraerValorJSON(body, "minutos");
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
  
  // --- Manejar solicitudes HTTP no bloqueantes ---
  manejarConsultaHTTP();
  
  // --- Iniciar consulta de comandos pendientes ---
  if (estadoHTTP == HTTP_IDLE && ahora - ultimaConsultaComandos >= intervaloConsultaComandos) {
    ultimaConsultaComandos = ahora;
    iniciarConsultaComandos();
  }

  // --- Ejecutar comando pendiente del backend ---
  if (comandoPendiente) {
    ejecutarComandoBackend(comandoActual);
  }
  
  // --- Manejar el movimiento de los motores según el modo ---
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
              moverPasos(motorHoras, stepIndexHoras, 1, !dirHoras);
              posHoras += (dirHoras ? 1 : -1);
            }

            int deltaMinutos = pasosMinutoEsperado - posMin;
            if (deltaMinutos != 0) {
              bool dirMin = (deltaMinutos > 0);
              // También invertimos la dirección para el motor de minutos
              moverPasos(motorMin, stepIndexMin, 1, !dirMin);
              posMin += (dirMin ? 1 : -1);
            }

            // Avanzar segundos en cada tick
            moverPasos(motorMin, stepIndexMin, 1, false);
          }
        }
      }
      break;
      
    case SWING:
      {
        unsigned long now = millis();
        if (now - swingUltimoMovimiento >= swingIntervalo) {
          swingUltimoMovimiento = now;
          swingSentido = !swingSentido;
          
          // Ambas manecillas oscilan en sentidos opuestos
          girarUnPaso(motorHoras, stepIndexHoras, swingSentido); 
          girarUnPaso(motorMin, stepIndexMin, !swingSentido);
        }
      }
      break;

    case STOP:
      // No hacer nada, motores detenidos
      break;
  }

  // --- Movimiento personalizado ---
  if (movimientoPersonalizadoActivo) {
    // Verificar si el tiempo ha expirado
    if (ahora - inicioMovimientoPersonalizado >= duracionMovimientoPersonalizado) {
      movimientoPersonalizadoActivo = false;
      modoActual = STOP;
      apagarMotor(motorHoras);
      apagarMotor(motorMin);
      Serial.println("Movimiento personalizado finalizado");
    } else {
      // Ejecutar movimiento personalizado
      // Horas
      bool dirHoras = (dirHorasPersonalizado == "izquierda");
      girarUnPaso(motorHoras, stepIndexHoras, dirHoras);
      delay(max(1, 100 - velHorasPersonalizado));
      
      // Minutos
      bool dirMin = (dirMinutosPersonalizado == "izquierda");
      girarUnPaso(motorMin, stepIndexMin, dirMin);
      delay(max(1, 100 - velMinutosPersonalizado));
    }
  }
}

// --- Función para girar un paso ---
void girarUnPaso(const int motorPins[4], int &stepIndex, bool sentidoHorario) {
  // Actualizar índice de paso
  if (sentidoHorario) {
    stepIndex = (stepIndex + 1) % 8;
  } else {
    stepIndex = (stepIndex + 7) % 8;
  }
  
  // Aplicar patrón al motor
  for (int i = 0; i < 4; i++) {
    digitalWrite(motorPins[i], steps[stepIndex][i]);
  }
}

// --- Función para mover varios pasos ---
void moverPasos(const int motorPins[4], int &stepIndex, int pasos, bool sentidoHorario) {
  for (int i = 0; i < pasos; i++) {
    girarUnPaso(motorPins, stepIndex, sentidoHorario);
    delay(velocidadPaso);
  }
}

// --- Función para mover motor con velocidad variable ---
// direccion: 1 = horario, -1 = antihorario, 0 = parado
void moverMotorVelocidad(const int motorPins[4], int &stepIndex, int direccion, int velocidad) {
  if (direccion == 0) {
    // Motor parado
    return;
  }
  
  // Limitar velocidad
  velocidad = constrain(velocidad, 1, 100);
  
  // Convertir velocidad (1-100) a delay (100-1)
  int delayMotor = map(velocidad, 1, 100, 15, 2);
  
  girarUnPaso(motorPins, stepIndex, direccion > 0);
  delay(delayMotor);
}

// --- Función para apagar motor ---
void apagarMotor(const int motorPins[4]) {
  for (int i = 0; i < 4; i++) {
    digitalWrite(motorPins[i], LOW);
  }
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

// --- Variables para gestionar las solicitudes HTTP asíncronas ---
int httpResponseCode = 0; // Variable global para guardar el código de respuesta

// --- Función para iniciar consulta de comandos (no bloqueante) ---
void iniciarConsultaComandos() {
  if (WiFi.status() == WL_CONNECTED && estadoHTTP == HTTP_IDLE) {
    Serial.println("📡 Iniciando consulta de comandos (no bloqueante)...");
    
    // Iniciar solicitud HTTP
    httpClient.begin("https://malbouche-backend.onrender.com/api/scheduler/esp32/commands");
    httpClient.addHeader("Content-Type", "application/json");
    httpClient.addHeader("User-Agent", "ESP32");
    
    // Realizar solicitud HTTP y guardar el código (esto es bloqueante, pero es rápido)
    httpResponseCode = httpClient.GET();
    Serial.printf("Código de respuesta inicial: %d\n", httpResponseCode);
    
    estadoHTTP = HTTP_CONSULTANDO;
    inicioHTTP = millis();
  }
}

// --- Función para manejar la consulta HTTP no bloqueante ---
void manejarConsultaHTTP() {
  unsigned long ahora = millis();
  
  // Verificar si hay una operación HTTP en curso
  if (estadoHTTP == HTTP_IDLE) {
    return;
  }
  
  // Verificar timeout
  if (ahora - inicioHTTP > timeoutHTTP) {
    Serial.println("⚠️ Timeout en operación HTTP");
    httpClient.end();
    estadoHTTP = HTTP_IDLE;
    return;
  }
  
  // Manejar estado de consulta de comandos
  if (estadoHTTP == HTTP_CONSULTANDO) {
    // Usar el código de respuesta que ya obtuvimos
    int httpCode = httpResponseCode;
    
    // Solicitud completada
    if (httpCode == HTTP_CODE_OK) {
      String payload = httpClient.getString();
      Serial.println("Respuesta del backend: " + payload);
      
      // Extraer comando del JSON
      String comando = extraerValorJSON(payload, "command");
      
      if (comando != "") {
        Serial.printf("🎯 Comando recibido: %s\n", comando.c_str());
        comandoPendiente = true;
        comandoActual = comando;
        
        // Iniciar confirmación de recepción
        httpClient.end();
        httpClient.begin("https://malbouche-backend.onrender.com/api/scheduler/esp32/commands/ack");
        httpClient.addHeader("Content-Type", "application/json");
        
        // Realizar solicitud POST y guardar código
        String postData = "{\"success\":true,\"message\":\"Comando recibido\"}";
        httpResponseCode = httpClient.POST(postData);
        
        estadoHTTP = HTTP_ENVIANDO_ACK;
        inicioHTTP = millis();
      } else {
        Serial.println("No hay comandos pendientes");
        httpClient.end();
        estadoHTTP = HTTP_IDLE;
      }
    } else if (httpCode == HTTP_CODE_NO_CONTENT) {
      // No hay comandos pendientes (204 No Content)
      Serial.println("No hay comandos pendientes (204)");
      httpClient.end();
      estadoHTTP = HTTP_IDLE;
    } else {
      // Otro código de respuesta
      Serial.printf("Error consultando comandos: código %d\n", httpCode);
      httpClient.end();
      estadoHTTP = HTTP_IDLE;
    }
  }
  // Manejar estado de envío de confirmación
  else if (estadoHTTP == HTTP_ENVIANDO_ACK) {
    // Usar el código de respuesta que ya obtuvimos
    int httpCode = httpResponseCode;
    
    // Confirmación enviada, no importa la respuesta
    Serial.println("✅ Confirmación de comando enviada");
    httpClient.end();
    estadoHTTP = HTTP_IDLE;
  }
}

// --- Función para ejecutar comando recibido del backend ---
void ejecutarComandoBackend(String comando) {
  Serial.printf("🎯 Ejecutando comando del backend: %s\n", comando.c_str());
  
  if (comando == "left") {
    modoActual = LEFT;
    Serial.println("Modo LEFT activado desde backend");
  } else if (comando == "right") {
    modoActual = RIGHT;
    Serial.println("Modo RIGHT activado desde backend");
  } else if (comando == "crazy") {
    modoActual = CRAZY;
    Serial.println("Modo CRAZY activado desde backend");
  } else if (comando == "normal") {
    modoActual = NORMAL;
    sincronizarHoraReal();
    Serial.println("Modo NORMAL activado desde backend");
  } else if (comando == "stop") {
    modoActual = STOP;
    apagarMotor(motorHoras);
    apagarMotor(motorMin);
    Serial.println("Motores detenidos desde backend");
  } else if (comando == "swing") {
    modoActual = SWING;
    Serial.println("Modo SWING activado desde backend");
  } else {
    Serial.printf("Comando desconocido: %s\n", comando.c_str());
  }
  
  comandoPendiente = false;
  comandoActual = "";
}
