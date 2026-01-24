//
//  Subtext_ScannerApp.swift
//  Subtext Scanner
//
//  Created by Jordan Schepton on 23/1/2026.
//

import SwiftUI
import CoreData

@main
struct Subtext_ScannerApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
