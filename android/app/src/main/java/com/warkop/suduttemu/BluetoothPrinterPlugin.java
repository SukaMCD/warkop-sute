package com.warkop.suduttemu;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Base64;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "NativeBluetoothPrinter",
    permissions = {
        @Permission(
            alias = "bluetooth",
            strings = {
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN
            }
        )
    }
)
public class BluetoothPrinterPlugin extends Plugin {

    // Standard SPP UUID for thermal ESC/POS printers
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket bluetoothSocket;
    private OutputStream outputStream;
    private String connectedAddress = null;
    private String connectedName = null;

    @Override
    public void load() {
        super.load();
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", bluetoothAdapter != null);
        ret.put("enabled", bluetoothAdapter != null && bluetoothAdapter.isEnabled());
        call.resolve(ret);
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (bluetoothAdapter == null) {
            call.reject("Bluetooth tidak tersedia di perangkat ini.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionForAlias("bluetooth", call, "bluetoothPermsCallback");
                return;
            }
        }

        try {
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            JSArray deviceList = new JSArray();

            if (pairedDevices != null) {
                for (BluetoothDevice device : pairedDevices) {
                    JSObject dev = new JSObject();
                    String name = device.getName();
                    dev.put("name", name != null ? name : "Printer Thermal");
                    dev.put("address", device.getAddress());
                    deviceList.put(dev);
                }
            }

            JSObject ret = new JSObject();
            ret.put("devices", deviceList);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Gagal mengambil daftar printer: " + e.getMessage());
        }
    }

    @PermissionCallback
    private void bluetoothPermsCallback(PluginCall call) {
        if (getPermissionState("bluetooth") == PermissionState.GRANTED) {
            getPairedDevices(call);
        } else {
            call.reject("Izin Bluetooth ditolak.");
        }
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("Alamat MAC printer (address) harus diisi.");
            return;
        }

        if (bluetoothAdapter == null) {
            call.reject("Bluetooth tidak tersedia.");
            return;
        }

        disconnectInternal();

        try {
            BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
            bluetoothSocket = device.createRfcommSocketToServiceRecord(SPP_UUID);

            if (bluetoothAdapter.isDiscovering()) {
                bluetoothAdapter.cancelDiscovery();
            }

            bluetoothSocket.connect();
            outputStream = bluetoothSocket.getOutputStream();
            connectedAddress = address;
            connectedName = device.getName() != null ? device.getName() : "Printer Thermal";

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("name", connectedName);
            ret.put("address", connectedAddress);
            call.resolve(ret);
        } catch (Exception e) {
            disconnectInternal();
            call.reject("Gagal menyambungkan ke printer: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        boolean connected = bluetoothSocket != null && bluetoothSocket.isConnected();
        JSObject ret = new JSObject();
        ret.put("connected", connected);
        ret.put("name", connected ? connectedName : "");
        ret.put("address", connected ? connectedAddress : "");
        call.resolve(ret);
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnectInternal();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    private synchronized void disconnectInternal() {
        try {
            if (outputStream != null) {
                outputStream.close();
            }
        } catch (Exception ignored) {}
        try {
            if (bluetoothSocket != null) {
                bluetoothSocket.close();
            }
        } catch (Exception ignored) {}
        outputStream = null;
        bluetoothSocket = null;
        connectedAddress = null;
        connectedName = null;
    }

    @PluginMethod
    public void print(PluginCall call) {
        String base64Data = call.getString("data");
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Data cetak tidak boleh kosong.");
            return;
        }

        if (bluetoothSocket == null || !bluetoothSocket.isConnected() || outputStream == null) {
            call.reject("Printer belum tersambung.");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            outputStream.write(bytes);
            outputStream.flush();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Gagal mencetak: " + e.getMessage());
        }
    }
}
