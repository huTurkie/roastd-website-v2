
import Foundation
import UIKit
import React

@objc(InstagramStoriesModule)
class InstagramStoriesModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func shareToInstagramStories(_ imageData: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let url = URL(string: "instagram-stories://share") else {
      reject("URL_ERROR", "Cannot create Instagram Stories URL", nil)
      return
    }
    
    guard UIApplication.shared.canOpenURL(url) else {
      reject("INSTAGRAM_NOT_AVAILABLE", "Instagram is not installed", nil)
      return
    }
    
    guard let imageDataDecoded = Data(base64Encoded: imageData) else {
      reject("IMAGE_ERROR", "Cannot decode image data", nil)
      return
    }
    
    let pasteboardItem = ["com.instagram.sharedSticker.backgroundImage": imageDataDecoded]
    let pasteboardOptions = [UIPasteboard.OptionsKey.expirationDate: Date().addingTimeInterval(60 * 5)]
    
    UIPasteboard.general.setItems([pasteboardItem], options: pasteboardOptions)
    
    UIApplication.shared.open(url, options: [:]) { success in
      if success {
        resolve(true)
      } else {
        reject("OPEN_ERROR", "Failed to open Instagram", nil)
      }
    }
  }
}
