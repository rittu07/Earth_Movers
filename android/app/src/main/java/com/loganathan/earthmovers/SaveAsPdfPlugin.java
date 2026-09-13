package com.loganathan.earthmovers;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;
import androidx.activity.result.ActivityResult;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.OutputStream;
import java.io.File;
import java.io.FileOutputStream;

@CapacitorPlugin(name = "SaveAsPdf")
public class SaveAsPdfPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("PDF data is required");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/pdf");
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("filename", "statement.pdf"));
        startActivityForResult(call, intent, "saveResult");
    }

    @PluginMethod
    public void share(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("PDF data is required");
            return;
        }

        try {
            File sharedDirectory = new File(getContext().getCacheDir(), "shared");
            if (!sharedDirectory.exists() && !sharedDirectory.mkdirs()) {
                call.reject("Unable to prepare PDF sharing");
                return;
            }
            File pdfFile = new File(sharedDirectory, call.getString("filename", "statement.pdf"));
            try (FileOutputStream output = new FileOutputStream(pdfFile)) {
                output.write(Base64.decode(data, Base64.DEFAULT));
            }

            Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                pdfFile
            );
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/pdf");
            shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(shareIntent, "Share PDF");
            startActivityForResult(call, chooser, "shareResult");
        } catch (Exception error) {
            call.reject("Unable to prepare PDF sharing", error);
        }
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_CANCELED || result.getData() == null) {
            call.reject("Save canceled");
            return;
        }

        Uri uri = result.getData().getData();
        if (uri == null) {
            call.reject("No save location selected");
            return;
        }

        try (OutputStream output = getContext().getContentResolver().openOutputStream(uri)) {
            if (output == null) {
                call.reject("Unable to open selected save location");
                return;
            }
            String data = call.getString("data", "");
            output.write(Base64.decode(data, Base64.DEFAULT));
            output.flush();
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to save PDF", error);
        }
    }

    @ActivityCallback
    private void shareResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            call.reject("Share canceled");
            return;
        }
        call.resolve();
    }
}
