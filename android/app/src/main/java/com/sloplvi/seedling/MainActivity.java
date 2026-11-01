package com.sloplvi.seedling;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Seedling's own plugin: saves finished images to the photo library
        registerPlugin(GalleryPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
