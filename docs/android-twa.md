# Publicar Nexus Engine como TWA en Android

El workflow [`.github/workflows/android-apk.yml`](../.github/workflows/android-apk.yml) genera un APK firmado y un App Bundle a partir del PWA publicado. Se ejecuta al subir un tag `v*` —incluido `v0.1.0`— o manualmente desde **Actions → Android APK (Trusted Web Activity) → Run workflow**.

## Configuración única de GitHub

No se guarda ninguna credencial ni keystore en el repositorio. Configura estos valores en **Settings → Secrets and variables → Actions**:

### Secrets

- `ANDROID_KEYSTORE_BASE64`: contenido de `android.keystore` codificado con `base64 -w 0 android.keystore`.
- `BUBBLEWRAP_KEYSTORE_PASSWORD`: contraseña del keystore.
- `BUBBLEWRAP_KEY_PASSWORD`: contraseña de la clave privada.

### Variables

- `NEXUS_ENGINE_PWA_URL` (opcional): URL HTTPS de producción. Por defecto es `https://gdevelop-design-guru.vercel.app`.
- `ANDROID_KEY_ALIAS` (opcional): alias de la clave. Por defecto es `android`.
- `ANDROID_SHA256_CERT_FINGERPRINT` (opcional): huella SHA-256 de la clave de publicación. Si no se indica, el workflow la obtiene del keystore.

Genera una clave nueva una sola vez si todavía no existe:

```sh
keytool -genkeypair -v \
  -keystore android.keystore \
  -alias android \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w 0 android.keystore
```

Conserva el keystore original y sus contraseñas para todas las futuras versiones. Android y Google Play rechazan actualizaciones firmadas con otra clave.

## Digital Asset Links

Para que Chrome reconozca el APK como una Trusted Web Activity a pantalla completa, el archivo debe estar disponible en:

```text
https://<tu-host>/.well-known/assetlinks.json
```

El workflow genera el archivo correcto como artefacto `assetlinks` en cada ejecución. Publícalo en el hosting del PWA conservando exactamente el paquete `com.nexusengine.studio` y la huella de la clave de publicación. Sin este archivo, Android seguirá abriendo el contenido mediante el fallback de Custom Tabs.

## Flujo de release

1. Configura los tres secrets y, si hace falta, la variable del host.
2. Fusiona el PR hacia `main`.
3. Crea y sube el tag desde este checkout:

   ```sh
   git tag -a v0.1.0 -m "Nexus Engine v0.1.0"
   git push origin v0.1.0
   ```

4. El workflow espera a que el despliegue de producción exponga el nuevo `manifest.webmanifest`, compila el TWA y crea el release de GitHub con el APK y el `.aab`.

El manifest de Bubblewrap de referencia está en [`android/twa-manifest.json`](../android/twa-manifest.json). El proyecto Android generado y la keystore son artefactos de CI y no se versionan.
