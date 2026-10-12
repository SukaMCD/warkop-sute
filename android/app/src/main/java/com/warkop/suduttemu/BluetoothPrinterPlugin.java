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
import java.lang.reflect.Method;
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

    private boolean checkBluetoothPermission(PluginCall call, String callbackName) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionForAlias("bluetooth", call, callbackName);
                return false;
            }
        }
        return true;
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hasAdapter = bluetoothAdapter != null;
        boolean isEnabled = hasAdapter && bluetoothAdapter.isEnabled();
        ret.put("available", hasAdapter);
        ret.put("enabled", isEnabled);
        call.resolve(ret);
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (bluetoothAdapter == null) {
            call.reject("Perangkat ini tidak memiliki modul Bluetooth.");
            return;
        }

        if (!bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth di HP belum dinyalakan. Silakan aktifkan Bluetooth terlebih dahulu.");
            return;
        }

        if (!checkBluetoothPermission(call, "bluetoothPermsCallback")) {
            return;
        }

        try {
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            JSArray deviceList = new JSArray();

            if (pairedDevices != null) {
                for (BluetoothDevice device : pairedDevices) {
                    JSObject dev = new JSObject();
                    String name = device.getName();
                    dev.put("name", (name != null && !name.trim().isEmpty()) ? name : "Printer Thermal");
                    dev.put("address", device.getAddress());
                    deviceList.put(dev);
                }
            }

            JSObject ret = new JSObject();
            ret.put("devices", deviceList);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Gagal membaca daftar printer terpasang: " + e.getMessage());
        }
    }

    @PermissionCallback
    public void bluetoothPermsCallback(PluginCall call) {
        if (getPermissionState("bluetooth") == PermissionState.GRANTED) {
            getPairedDevices(call);
        } else {
            call.reject("Izin akses Bluetooth ditolak oleh pengguna.");
        }
    }

    @PermissionCallback
    public void connectPermsCallback(PluginCall call) {
        if (getPermissionState("bluetooth") == PermissionState.GRANTED) {
            connect(call);
        } else {
            call.reject("Izin akses Bluetooth ditolak oleh pengguna.");
        }
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.trim().isEmpty()) {
            call.reject("Alamat printer (MAC address) harus diisi.");
            return;
        }

        if (bluetoothAdapter == null) {
            call.reject("Perangkat ini tidak memiliki modul Bluetooth.");
            return;
        }

        if (!bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth di HP belum aktif. Harap nyalakan Bluetooth HP terlebih dahulu.");
            return;
        }

        if (!checkBluetoothPermission(call, "connectPermsCallback")) {
            return;
        }

        final String targetAddress = address.trim();

        // Run socket connection on a background worker thread to prevent freezing UI
        new Thread(() -> {
            disconnectInternal();

            BluetoothSocket socket = null;
            BluetoothDevice device = null;

            try {
                device = bluetoothAdapter.getRemoteDevice(targetAddress);

                if (bluetoothAdapter.isDiscovering()) {
                    bluetoothAdapter.cancelDiscovery();
                }

                // Tier 1: Standard Secure RFCOMM SPP socket
                try {
                    socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                    socket.connect();
                } catch (Exception e1) {
                    // Tier 2: Insecure RFCOMM socket
                    try {
                        if (socket != null) {
                            socket.close();
                        }
                    } catch (Exception ignored) {}

                    try {
                        socket = device.createInsecureRfcommSocketToServiceRecord(SPP_UUID);
                        socket.connect();
                    } catch (Exception e2) {
                        // Tier 3: Reflection fallback (Port 1) - Common for Chinese thermal printers like Iware/RPP
                        try {
                            if (socket != null) {
                                socket.close();
                            }
                        } catch (Exception ignored) {}

                        Method method = device.getClass().getMethod("createRfcommSocket", int.class);
                        socket = (BluetoothSocket) method.invoke(device, 1);
                        if (socket != null) {
                            socket.connect();
                        } else {
                            throw new Exception("Gagal membuat RFCOMM socket printer.");
                        }
                    }
                }

                synchronized (BluetoothPrinterPlugin.this) {
                    bluetoothSocket = socket;
                    outputStream = socket.getOutputStream();
                    connectedAddress = targetAddress;
                    String devName = device.getName();
                    connectedName = (devName != null && !devName.trim().isEmpty()) ? devName : "Printer Thermal";
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("name", connectedName);
                ret.put("address", connectedAddress);
                call.resolve(ret);

            } catch (Exception e) {
                disconnectInternal();
                call.reject("Gagal menghubungkan ke printer: " + (e.getMessage() != null ? e.getMessage() : "Koneksi ditolak"));
            }
        }).start();
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        synchronized (this) {
            boolean connected = bluetoothSocket != null && bluetoothSocket.isConnected();
            JSObject ret = new JSObject();
            ret.put("connected", connected);
            ret.put("name", connected ? connectedName : "");
            ret.put("address", connected ? connectedAddress : "");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        new Thread(() -> {
            disconnectInternal();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        }).start();
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

        synchronized (this) {
            if (bluetoothSocket == null || !bluetoothSocket.isConnected() || outputStream == null) {
                call.reject("Printer belum tersambung via Bluetooth.");
                return;
            }
        }

        new Thread(() -> {
            try {
                byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                synchronized (BluetoothPrinterPlugin.this) {
                    if (outputStream != null) {
                        outputStream.write(bytes);
                        outputStream.flush();
                    } else {
                        throw new Exception("Jalur cetak printer terputus.");
                    }
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Gagal mencetak ke printer: " + (e.getMessage() != null ? e.getMessage() : "Error data"));
            }
        }).start();
    }
}
