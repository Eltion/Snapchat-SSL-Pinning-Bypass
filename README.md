# Snapchat SSL Pinning Bypass

Bypass Snapchat SSL pinning on Android devices.  
Supported ABIs: `armeabi-v7a`, `arm64-v8a`  
Latest version: `v12.16.0.28`

If you like this project:  
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/eltimusa4q)

## Patched APK (No Root)

Download the latest patched APK: 
+ [snapchat-v12.16.0.28.apk](https://github.com/Eltion/Snapchat-SSL-Pinning-Bypass/releases/download/v12.16.0.28/snapchat-v12.16.0.28.apk)

[See all versions](https://github.com/Eltion/Snapchat-SSL-Pinning-Bypass/releases/)

## Run using Frida (Requires Root)

This method requires frida-tools and also frida-server running in the device
```
frida -U -l .\snapchat-ssl-pinning-bypass.js -f com.snapchat.android --no-pause
```

## Patch APK

You can create your own patched APK. 


### Requirements Linux (Ubuntu):
1. Install java JRE: `sudo apt install default-jre`
2. Install apksigner: `sudo apt install apksigner`
3. Install zipalign: `sudo apt install zipalign`  

Note: apksigner and zipalign can also be found in android sdk [build-tools](https://dl.google.com/android/repository/build-tools_r30.0.1-linux.zip)

### Requirements Windows:
1. Install java JRE
2. Download [build-tools](https://dl.google.com/android/repository/build-tools_r30.0.1-windows.zip) and unzip
3. Add unzip folder to path variable

### Instructions

1. Download Snapchat apk file.
2. Install requirements > `pip install -r requirements.txt`
3. Run script > `python patch_apk.py -i <input apk> -o <output apk>`

After that an patched apk file should be generated.

## Intercept network traffic

You can use a tool like mitmproxy or Burp Suite to intercept the network.

1. Install patched APK in the device
2. Install [mitmproxy](https://mitmproxy.org/) or [Burp Suite](https://portswigger.net/burp)
3. Set up proxy for wifi settings or run: `adb shell settings put global http_proxy <proxy>`

Now you should be able to see the network traffic.

![image](https://user-images.githubusercontent.com/18504798/204705212-7affe211-164e-4d9e-b573-443dff68c4ca.png)

## View script logs
To view the logcat run:
```
adb logcat -s "SNAPCHAT_SSL_PINNING_BYPASS:V"
```

[#leftenter](#leftenter)
