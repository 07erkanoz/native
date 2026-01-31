package com.lifecall;

import android.os.Build;
import android.telecom.Connection;
import android.telecom.ConnectionRequest;
import android.telecom.ConnectionService;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;

import androidx.annotation.RequiresApi;

/**
 * LifeCall - Arama Bağlantı Servisi
 *
 * Android Telecom Framework ile entegrasyon sağlar.
 * Gelen ve giden aramaları yönetir.
 */
@RequiresApi(api = Build.VERSION_CODES.M)
public class CallConnectionService extends ConnectionService {

    @Override
    public Connection onCreateIncomingConnection(
            PhoneAccountHandle connectionManagerPhoneAccount,
            ConnectionRequest request) {

        LifeCallConnection connection = new LifeCallConnection();
        connection.setConnectionCapabilities(
                Connection.CAPABILITY_MUTE |
                Connection.CAPABILITY_SUPPORT_HOLD |
                Connection.CAPABILITY_HOLD
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
            connection.setConnectionProperties(Connection.PROPERTY_SELF_MANAGED);
        }

        connection.setInitializing();

        // Arayan bilgisini al
        if (request.getAddress() != null) {
            connection.setAddress(request.getAddress(), TelecomManager.PRESENTATION_ALLOWED);
        }

        return connection;
    }

    @Override
    public Connection onCreateOutgoingConnection(
            PhoneAccountHandle connectionManagerPhoneAccount,
            ConnectionRequest request) {

        LifeCallConnection connection = new LifeCallConnection();
        connection.setConnectionCapabilities(
                Connection.CAPABILITY_MUTE |
                Connection.CAPABILITY_SUPPORT_HOLD |
                Connection.CAPABILITY_HOLD
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
            connection.setConnectionProperties(Connection.PROPERTY_SELF_MANAGED);
        }

        connection.setInitializing();

        if (request.getAddress() != null) {
            connection.setAddress(request.getAddress(), TelecomManager.PRESENTATION_ALLOWED);
        }

        connection.setDialing();

        return connection;
    }

    @Override
    public void onCreateIncomingConnectionFailed(
            PhoneAccountHandle connectionManagerPhoneAccount,
            ConnectionRequest request) {
        super.onCreateIncomingConnectionFailed(connectionManagerPhoneAccount, request);
    }

    @Override
    public void onCreateOutgoingConnectionFailed(
            PhoneAccountHandle connectionManagerPhoneAccount,
            ConnectionRequest request) {
        super.onCreateOutgoingConnectionFailed(connectionManagerPhoneAccount, request);
    }

    /**
     * LifeCall Bağlantı Sınıfı
     */
    public static class LifeCallConnection extends Connection {

        public LifeCallConnection() {
            super();
        }

        @Override
        public void onStateChanged(int state) {
            super.onStateChanged(state);
            // Durum değişikliğini React Native'e bildir
        }

        @Override
        public void onAnswer() {
            super.onAnswer();
            setActive();
        }

        @Override
        public void onReject() {
            super.onReject();
            setDisconnected(new android.telecom.DisconnectCause(
                    android.telecom.DisconnectCause.REJECTED
            ));
            destroy();
        }

        @Override
        public void onDisconnect() {
            super.onDisconnect();
            setDisconnected(new android.telecom.DisconnectCause(
                    android.telecom.DisconnectCause.LOCAL
            ));
            destroy();
        }

        @Override
        public void onAbort() {
            super.onAbort();
            setDisconnected(new android.telecom.DisconnectCause(
                    android.telecom.DisconnectCause.CANCELED
            ));
            destroy();
        }

        @Override
        public void onHold() {
            super.onHold();
            setOnHold();
        }

        @Override
        public void onUnhold() {
            super.onUnhold();
            setActive();
        }

        @Override
        public void onPlayDtmfTone(char c) {
            super.onPlayDtmfTone(c);
            // DTMF tonu çal
        }

        @Override
        public void onStopDtmfTone() {
            super.onStopDtmfTone();
        }
    }
}
