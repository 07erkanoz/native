package com.lifecall;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * LifeCall - React Native Paket Kaydı
 *
 * Native modülleri React Native'e kaydeder.
 */
public class LifeCallPackage implements ReactPackage {

    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();

        // Varsayılan uygulama modülü
        modules.add(new DefaultAppModule(reactContext));

        // İzin modülü
        modules.add(new PermissionsModule(reactContext));

        // Çağrı modülü
        modules.add(new CallModule(reactContext));

        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
