import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web - '
        'run `flutterfire configure` if web support is needed.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are only configured for Android in this '
          'project - run `flutterfire configure` to add iOS/macOS support.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAZmp0fX8-WdUeb8BYEg8afrEtu5ZIc9Uo',
    appId: '1:192882982454:android:a02b4d09ca85fd1f1ca297',
    messagingSenderId: '192882982454',
    projectId: 'komplekku-6e0c6',
    storageBucket: 'komplekku-6e0c6.firebasestorage.app',
  );
}
