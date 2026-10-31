const {
  withAndroidManifest,
  withAndroidStyles,
  withAndroidColors,
  withAppBuildGradle,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
const icon =
  '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#143448" android:pathData="M0,0h108v108h-108z"/><path android:fillColor="#E87938" android:pathData="M54,34C36,16 17,39 34,54L54,72L74,54C91,39 72,16 54,34Z"/><path android:fillColor="#FFFFFF" android:pathData="M26,64L51,82Q54,84 57,82L82,64L82,76L54,94L26,76Z"/></vector>';
// Keeps LAN demo settings and the project branding reproducible after expo prebuild.
module.exports = function withReliefAndroid(config) {
  config = withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes("// ReliefConnect ABI filters")) {
      c.modResults.contents = c.modResults.contents.replace(
        "defaultConfig {",
        "defaultConfig {\n        // ReliefConnect ABI filters: match the native architectures actually compiled.\n        ndk { abiFilters(*((findProperty('reactNativeArchitectures') ?: 'arm64-v8a').split(','))) }",
      );
    }
    return c;
  });
  config = withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    const application = manifest.application[0].$;
    Object.assign(application, {
      "android:usesCleartextTraffic": "true",
      "android:allowBackup": "false",
      "android:icon": "@drawable/relief_icon",
      "android:roundIcon": "@drawable/relief_icon",
    });
    manifest["uses-permission"] = (manifest["uses-permission"] || []).filter(
      (p) => p.$["android:name"] !== "android.permission.SYSTEM_ALERT_WINDOW",
    );
    for (const permission of manifest["uses-permission"]) {
      if (
        permission.$["android:name"] ===
        "android.permission.READ_EXTERNAL_STORAGE"
      )
        permission.$["android:maxSdkVersion"] = "32";
      if (
        permission.$["android:name"] ===
        "android.permission.WRITE_EXTERNAL_STORAGE"
      )
        permission.$["android:maxSdkVersion"] = "28";
    }
    return c;
  });
  config = withAndroidColors(config, (c) => {
    for (const color of c.modResults.resources.color || [])
      if (
        [
          "splashscreen_background",
          "colorPrimary",
          "colorPrimaryDark",
        ].includes(color.$.name)
      )
        color._ = "#143448";
    return c;
  });
  config = withAndroidStyles(config, (c) => {
    for (const style of c.modResults.resources.style || [])
      for (const item of style.item || []) {
        if (
          style.$.name === "Theme.App.SplashScreen" &&
          item.$.name === "android:windowBackground"
        )
          item._ = "@drawable/relief_splash";
        if (item.$.name === "android:statusBarColor") item._ = "#143448";
      }
    return c;
  });
  return withDangerousMod(config, [
    "android",
    async (c) => {
      const dir = path.join(
        c.modRequest.platformProjectRoot,
        "app/src/main/res/drawable",
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "relief_icon.xml"), icon);
      fs.writeFileSync(
        path.join(dir, "relief_splash.xml"),
        '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/splashscreen_background"/><item android:drawable="@drawable/relief_icon" android:gravity="center" android:width="108dp" android:height="108dp"/></layer-list>',
      );
      return c;
    },
  ]);
};
