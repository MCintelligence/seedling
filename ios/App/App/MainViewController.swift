import UIKit
import Capacitor

/// Seedling's web view controller. Registers the app's own plugins.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(GalleryPlugin())
    }
}
