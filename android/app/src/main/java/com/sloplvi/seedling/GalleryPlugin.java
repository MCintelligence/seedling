package com.sloplvi.seedling;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;

/**
 * Saves a finished image into the photo library under Pictures/Seedling.
 * Android 10 and newer: uses MediaStore and needs no permission at all.
 * Android 7 to 9: asks for storage permission once (declared with maxSdkVersion 28).
 * Seedling never reads the user's photo library; photos to edit come from the system picker.
 */
@CapacitorPlugin(
    name = "SeedlingGallery",
    permissions = { @Permission(alias = "legacyStorage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }) }
)
public class GalleryPlugin extends Plugin {

    @PluginMethod
    public void saveImage(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("legacyStorage") != PermissionState.GRANTED) {
            requestPermissionForAlias("legacyStorage", call, "legacyStorageCallback");
            return;
        }
        save(call);
    }

    @PermissionCallback
    private void legacyStorageCallback(PluginCall call) {
        if (getPermissionState("legacyStorage") == PermissionState.GRANTED) save(call);
        else call.reject("Permission to save photos was not given.", "denied");
    }

    private void save(PluginCall call) {
        String data = call.getString("data");
        String mime = call.getString("mimeType", "image/png");
        String name = call.getString("fileName", "seedling-" + System.currentTimeMillis() + (mime.equals("image/jpeg") ? ".jpg" : ".png"));
        if (data == null || data.isEmpty()) {
            call.reject("No image to save.");
            return;
        }
        int comma = data.indexOf(',');
        if (data.startsWith("data:") && comma > 0) data = data.substring(comma + 1);

        final String b64 = data, fileName = name, mimeType = mime;
        // Decode and write off the main thread: large exports can be tens of megabytes
        new Thread(() -> {
            ContentResolver resolver = getContext().getContentResolver();
            Uri uri = null;
            try {
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                ContentValues v = new ContentValues();
                v.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                v.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Seedling");
                    v.put(MediaStore.Images.Media.IS_PENDING, 1);
                    uri = resolver.insert(MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), v);
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Seedling");
                    if (!dir.exists() && !dir.mkdirs()) throw new IOException("Could not create the Seedling folder.");
                    v.put(MediaStore.Images.Media.DATA, new File(dir, fileName).getAbsolutePath());
                    uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                }
                if (uri == null) throw new IOException("Could not create the image file.");
                try (OutputStream os = resolver.openOutputStream(uri)) {
                    if (os == null) throw new IOException("Could not open the image file.");
                    os.write(bytes);
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues done = new ContentValues();
                    done.put(MediaStore.Images.Media.IS_PENDING, 0);
                    resolver.update(uri, done, null, null);
                }
                JSObject ret = new JSObject();
                ret.put("uri", uri.toString());
                call.resolve(ret);
            } catch (Exception e) {
                if (uri != null) {
                    try { resolver.delete(uri, null, null); } catch (Exception ignored) {}
                }
                call.reject("The image could not be saved.", e);
            }
        }).start();
    }
}
