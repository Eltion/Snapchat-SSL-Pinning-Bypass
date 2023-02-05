const pattern_arm64 = 'fd 7b ba a9 fc 6f 01 a9 fa 67 02 a9 f8 5f 03 a9 f6 57 04 a9 f4 4f 05 a9 fd 03 00 91 ff 43 0e d1 53';
const pattern_arm = '2d e9 f0 4f ad f5 0b 7d 81 46 b5 48';

//Only needed when apk is patched with frida-gadget
//spoofSignature() 

function spoofSignature() {
    const originalSignature = "<ORIGINAL_APK_SIGNATURE>" //This will be set by patch_apk.py
    Java.perform(() => {
        const PackageManager = Java.use("android.app.ApplicationPackageManager");
        const Signature = Java.use("android.content.pm.Signature");
        PackageManager.getPackageInfo.overload('java.lang.String', 'int').implementation = function (a, b) {
            const packageInfo = this.getPackageInfo(a, b);
            if (a == "com.snapchat.android" && b == 64) {
                const signature = Signature.$new(originalSignature);
                packageInfo.signatures.value = Java.array('android.content.pm.Signature', [signature]);
            }
            return packageInfo;
        }
    });
}


function hook_PKPState_CheckPublicKeyPins_by_pattern(library, pattern) {
    let found = false;

    Memory.scan(library.base, library.size, pattern, {
        onMatch(address, size) {
            found = true;
            hook_PKPState_CheckPublicKeyPins_by_address(address);
            return 'stop';
        },
        onComplete() {
            if (!found) {
                logger("[*][-] Failed to find PKPState->CheckPublicKeyPins function")
            }
        }
    });
}

function hook_PKPState_CheckPublicKeyPins_by_offset(library, offset) {
    hook_PKPState_CheckPublicKeyPins_by_address(library.base.add(offset));
}

function hook_PKPState_CheckPublicKeyPins_by_address(address) {
    try {
        const thumb = Process.arch == "arm" ? 1 : 0
        Interceptor.attach(address.add(thumb), {
            onLeave: function (retvalue) {
                retvalue.replace(1);
            }
        });
        logger("[*][+] Hooked KPState->CheckPublicKeyPins");
    } catch (e) {
        logger("[*][-] Failed to hook function: KPState->CheckPublicKeyPins")
    }
}



function logger(message) {
    console.log(message);
    Java.perform(function () {
        var Log = Java.use("android.util.Log");
        Log.v("SNAPCHAT_SSL_PINNING_BYPASS", message);
    });
}

function waitForModule(moduleName) {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const module = Process.findModuleByName(moduleName);
            if (module != null) {
                clearInterval(interval);
                resolve(module);
            }
        }, 10);
    });
}

Java.perform(function () {
    try {
        var array_list = Java.use("java.util.ArrayList");
        var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        if (ApiClient.checkTrustedRecursive) {
            logger("[*][+] Hooked checkTrustedRecursive")
            ApiClient.checkTrustedRecursive.implementation = function (a1, a2, a3, a4, a5, a6) {
                var k = array_list.$new();
                return k;
            }
        } else {
            logger("[*][-] checkTrustedRecursive not Found")
        }
    } catch (e) {
        logger("[*][-] Failed to hook checkTrustedRecursive")
    }
});

Java.perform(function () {
    try {
        const x509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
        const sSLContext = Java.use("javax.net.ssl.SSLContext");
        const TrustManager = Java.registerClass({
            implements: [x509TrustManager],
            methods: {
                checkClientTrusted(chain, authType) {
                },
                checkServerTrusted(chain, authType) {
                },
                getAcceptedIssuers() {
                    return [];
                },
            },
            name: "com.leftenter.snapchat",
        });
        const TrustManagers = [TrustManager.$new()];
        const SSLContextInit = sSLContext.init.overload(
            "[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom");
        SSLContextInit.implementation = function (keyManager, trustManager, secureRandom) {
            SSLContextInit.call(this, keyManager, TrustManagers, secureRandom);
        };
        logger("[*][+] Hooked SSLContextInit")
    } catch (e) {
        logger("[*][-] Failed to hook SSLContextInit")
    }
});


waitForModule("libclient.so").then(lib => {
    //hook_PKPState_CheckPublicKeyPins_by_offset(lib, offset) // get offset with static analyse
    if (Process.arch == "arm64") {
        hook_PKPState_CheckPublicKeyPins_by_pattern(lib, pattern_arm64);
    } else if (Process.arch == "arm") {
        hook_PKPState_CheckPublicKeyPins_by_pattern(lib, pattern_arm);
    }
});

