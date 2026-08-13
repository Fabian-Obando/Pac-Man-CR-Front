import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {

  // Identificador de la aplicación Android
  appId: 'com.pacmancr.app',

  // Nombre visible
  appName: 'Pac-Man CR',

  // Carpeta generada por ionic build
  webDir: 'www',

  // =====================================================
  // CONFIGURACIÓN ANDROID / CAPACITOR
  // =====================================================
  server: {

    /*
     * IMPORTANTE:
     *
     * Nuestro Backend actualmente trabaja mediante HTTP:
     *
     * http://192.168.1.16:5148
     *
     * Capacitor estaba cargando la aplicación mediante:
     *
     * https://localhost
     *
     * Eso producía el error "Mixed Content".
     *
     * Al usar HTTP también en la WebView:
     *
     * http://localhost
     *
     * Android permite comunicarse con nuestro Backend HTTP.
     */
    androidScheme: 'http'
  }

};

export default config;