import Capacitor
import Photos

/// Saves a finished image to the user's photo library.
/// Asks only for "add photos" access (iOS 14+), never for permission to read the library.
@objc(GalleryPlugin)
public class GalleryPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GalleryPlugin"
    public let jsName = "SeedlingGallery"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveImage", returnType: CAPPluginReturnPromise)
    ]

    @objc func saveImage(_ call: CAPPluginCall) {
        guard var b64 = call.getString("data"), !b64.isEmpty else {
            call.reject("No image to save.")
            return
        }
        if b64.hasPrefix("data:"), let comma = b64.firstIndex(of: ",") {
            b64 = String(b64[b64.index(after: comma)...])
        }
        guard let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters) else {
            call.reject("The image data was not valid.")
            return
        }
        let fileName = call.getString("fileName")

        let save = {
            PHPhotoLibrary.shared().performChanges({
                let request = PHAssetCreationRequest.forAsset()
                let options = PHAssetResourceCreationOptions()
                options.originalFilename = fileName
                // The original PNG/JPEG bytes are stored as-is, so sticker transparency is kept
                request.addResource(with: .photo, data: data, options: options)
            }) { success, error in
                if success { call.resolve() }
                else { call.reject(error?.localizedDescription ?? "The image could not be saved.") }
            }
        }

        switch PHPhotoLibrary.authorizationStatus(for: .addOnly) {
        case .authorized, .limited:
            save()
        case .notDetermined:
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                if status == .authorized || status == .limited { save() }
                else { call.reject("Seedling isn't allowed to add photos.", "denied") }
            }
        default:
            call.reject("Seedling isn't allowed to add photos.", "denied")
        }
    }
}
