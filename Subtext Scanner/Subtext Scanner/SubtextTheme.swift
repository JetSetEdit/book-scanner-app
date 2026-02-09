//
//  SubtextTheme.swift
//  Subtext Scanner
//
//  Created by Jordan Schepton on 23/1/2026.
//

import SwiftUI

enum SubtextTheme {
    enum Colors {
        static let background = Color(red: 0.95, green: 0.94, blue: 0.88)
        static let primary = Color(red: 0.36, green: 0.30, blue: 0.20)
        static let secondary = Color(red: 0.52, green: 0.47, blue: 0.36)
        static let highlight = Color(red: 0.68, green: 0.45, blue: 0.22)
        static let searchBorder = Color(red: 0.84, green: 0.82, blue: 0.72)
        static let searchFill = Color.white.opacity(0.6)
        static let badgeFill = Color.white.opacity(0.5)
    }

    enum Typography {
        static let badge = Font.system(size: 26, weight: .bold, design: .serif)
        static let heroInitial = Font.system(size: 120, weight: .black, design: .serif)
        static let appName = Font.system(size: 44, weight: .bold, design: .serif)
        static let tagline = Font.system(size: 30, weight: .semibold, design: .serif)
        static let search = Font.system(size: 16, weight: .medium, design: .serif)
        static let body = Font.system(size: 17, weight: .medium, design: .serif)
        static let tabLabel = Font.system(size: 12, weight: .semibold, design: .serif)
        static let tabIcon = Font.system(size: 18, weight: .medium)
    }
}
