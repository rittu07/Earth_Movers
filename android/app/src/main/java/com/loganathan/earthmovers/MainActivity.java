package com.loganathan.earthmovers;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(SaveAsPdfPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
