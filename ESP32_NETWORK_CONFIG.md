# ESP32 Network Configuration Guide

## Problem Diagnosed

The ESP32 timeout error occurs because of network configuration mismatches:

- **Backend expects ESP32 at**: `192.168.0.175`
- **Arduino was configured for**: `"LARA GAMING"` network 
- **Arduino was sending sensor data to**: `172.18.2.82:3000`

## Solution Steps

### 1. Network Configuration
```arduino
// In arduino.txt, update WiFi settings:
const char* ssid = "YOUR_NETWORK_NAME";      // Network where 192.168.0.175 is accessible
const char* password = "YOUR_NETWORK_PASSWORD";
```

### 2. Backend IP Configuration  
```arduino
// Update all sensor data endpoints to correct backend IP:
http.begin("http://192.168.0.XXX:3000/adminBackend/sensores/dht11");
http.begin("http://192.168.0.XXX:3000/adminBackend/sensores/mlx90614"); 
http.begin("http://192.168.0.XXX:3000/adminBackend/sensores/ultrasonico");
```

### 3. IP Address Management Options

#### Option A: Static IP (Recommended)
Add to Arduino setup():
```arduino
// Configure static IP to match backend expectation
WiFi.config(IPAddress(192,168,0,175), IPAddress(192,168,0,1), IPAddress(255,255,255,0));
WiFi.begin(ssid, password);
```

#### Option B: Dynamic IP + Backend Update
1. Let ESP32 get dynamic IP
2. Check Serial Monitor for assigned IP
3. Update backend configuration to use that IP

### 4. Verification Steps

1. **Upload Arduino code** with correct network settings
2. **Check Serial Monitor** for:
   ```
   === INFORMACIÓN DE RED ===
   IP asignada: 192.168.0.175  <- Should match backend expectation
   SSID: YOUR_NETWORK_NAME
   ```

3. **Test connectivity** from backend:
   ```bash
   curl http://192.168.0.175/ping
   ```

4. **Check backend logs** for successful ESP32 communication

### 5. Troubleshooting

- **Connection refused**: ESP32 not on expected network
- **Timeout**: Network connectivity issues or wrong IP
- **Wrong IP**: Check router DHCP settings or use static IP

## Current Status

✅ Arduino code updated with placeholders  
⚠️ Need to configure actual network credentials  
⚠️ Need to verify/set correct backend IP addresses  
⚠️ Consider using static IP for ESP32  
