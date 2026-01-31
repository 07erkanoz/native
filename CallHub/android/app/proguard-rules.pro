# LifeCall ProGuard Rules

# React Native
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# LifeCall native modülleri
-keep class com.lifecall.** { *; }
-keep class com.lifecall.receivers.** { *; }
-keep class com.lifecall.services.** { *; }

# React Native modules
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}

# Telecom API
-keep class android.telecom.** { *; }

# AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
