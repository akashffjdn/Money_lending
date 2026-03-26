# LendEase - Money Lending Mobile App

A production-grade fintech loan management app built for the Indian market.
Built with React Native, Expo SDK 54, and TypeScript.

    App Name       : LendEase
    Bundle ID      : com.unitednexatech.lendease
    EAS Project ID : 1c263d1d-9212-4aeb-b347-e8e4042f0472
    Organization   : United Nexa Tech


---


## 1. Tech Stack

    Framework      : React Native 0.81.5 + Expo SDK 54
    Language       : TypeScript 5.9
    State          : Zustand 5.0
    Navigation     : React Navigation 7 (Native Stack + Bottom Tabs)
    Forms          : React Hook Form + Zod
    Animations     : Reanimated 4.1 + Custom MotiCompat
    Charts         : react-native-gifted-charts
    Payments       : Razorpay Native SDK
    Storage        : MMKV + AsyncStorage
    Styling        : StyleSheet + NativeWind + LinearGradient
    Haptics        : expo-haptics
    Icons          : @expo/vector-icons (MaterialCommunityIcons)


---


## 2. App Screens (23 Total)


### 2.1 Authentication (4 screens)

    1. Welcome         - Onboarding carousel with 3 image+text slides, "Get Started" button
    2. Login            - Phone/email login, inline validation icons, gold-themed focus rings
    3. OTP Verification - 4/6 digit OTP input, auto-focus, countdown timer, success animation
    4. Personal Info    - Registration form, real-time validation, password strength indicator


### 2.2 Home (3 screens)

    5. Home             - Dashboard with branded header, active loan cards, KYC status, theme toggle
    6. Notifications    - Categorized alerts (Payments/Loans/Alerts), read/unread, "Read All"
    7. EMI Calculator   - Interactive sliders for amount/tenure/rate, real-time EMI computation


### 2.3 Loans (5 screens)

    8.  Loan List        - All loans as cards with status badges (Active / Closed / Overdue)
    9.  Loan Detail      - Full view with repayment schedule, Pay Now & Prepay via Razorpay
    10. Loan Application - Multi-step form with progress indicator, step-by-step navigation
    11. Loan Statement   - ProgressRing (% paid), date/status filters, Download/Share/Email
    12. Track Application- Timeline: Submitted > Under Review > Approved > Disbursed


### 2.4 Payments (2 screens)

    13. Payment Dashboard - Overview of pending, paid, and overdue payments with quick actions
    14. Payment History   - Transaction history with filters, payment receipts


### 2.5 Profile (6 screens)

    15. Profile          - User dashboard with avatar, settings menu, sub-screen navigation
    16. Edit Profile     - Update personal information form
    17. Bank Accounts    - Manage linked banks, primary badge, IFSC auto-detect, gold hero card
    18. Payment Methods  - Segmented tabs (Cards / UPI / Autopay), realistic card visuals
    19. EMI Calendar     - Custom 7-column calendar, color-coded dots per loan, day detail sheet
    20. Help & FAQ       - Searchable FAQ with expandable answers, contact support


### 2.6 KYC (1 screen)

    21. KYC Verification - Multi-step: PAN > Aadhaar > Selfie > Bank verification


### 2.7 Shared Bottom Sheets

    22. Payment Flow Sheet - Step-by-step: select method > confirm > processing > success
    23. Language Sheet     - 12 Indian languages (Hindi, Tamil, Telugu, Bengali, etc.)


---


## 3. Project Structure

    lend-ease/
    |
    |-- src/
    |   |
    |   |-- components/              30 reusable components
    |   |   |-- feedback/            EmptyState, ErrorBoundary, LoadingOverlay, Skeleton, Toast
    |   |   |-- layout/              Divider, KeyboardAvoid, ScreenWrapper, Section
    |   |   |-- shared/              PaymentFlowSheet, LanguageSheet, EMICalculatorSheet,
    |   |   |                        Header, ProgressRing, BulkPaymentSheet, etc.
    |   |   |-- ui/                  AppButton, AppCard, AppInput, AppChip,
    |   |                            AppSlider, AppSwitch, AppAvatar, AppBadge, AppRadio
    |   |
    |   |-- screens/                 23 screens (see section 2)
    |   |   |-- auth/                Welcome, Login, OTP, PersonalInfo
    |   |   |-- home/                Home, Notifications, EMICalculator
    |   |   |-- kyc/                 KYC Verification
    |   |   |-- loans/               LoanList, LoanDetail, LoanApplication,
    |   |   |                        LoanStatement, TrackApplication
    |   |   |-- payments/            PaymentDashboard, PaymentHistory
    |   |   |-- profile/             Profile, EditProfile, BankAccounts,
    |   |                            PaymentMethods, EMICalendar, Help
    |   |
    |   |-- store/                   8 Zustand stores
    |   |   |-- authStore            User session, login/logout
    |   |   |-- bankStore            Bank accounts, cards, UPI, autopay
    |   |   |-- kycStore             KYC verification status
    |   |   |-- loanStore            Active loans, repayment schedules
    |   |   |-- loanApplicationStore Multi-step loan application state
    |   |   |-- notificationStore    In-app notifications
    |   |   |-- paymentStore         Payment methods, Razorpay processing
    |   |   |-- themeStore           Dark / Light mode toggle
    |   |
    |   |-- navigation/              8 navigators
    |   |   |-- RootNavigator        Auth vs Main routing
    |   |   |-- AuthStack            Welcome > Login > OTP > PersonalInfo
    |   |   |-- MainTabNavigator     Bottom tabs (Home, Loans, Apply, Payments, Profile)
    |   |   |-- HomeStack            Home, Notifications, EMICalculator
    |   |   |-- LoanStack            LoanList, LoanDetail, LoanStatement
    |   |   |-- ApplyStack           LoanApplication, TrackApplication
    |   |   |-- PaymentStack         PaymentDashboard, PaymentHistory
    |   |   |-- ProfileStack         Profile + all sub-screens
    |   |
    |   |-- hooks/                   5 custom hooks
    |   |   |-- useAnimatedEntry     Screen entry animations
    |   |   |-- useAuth              Authentication logic
    |   |   |-- useEMICalculator     EMI computation
    |   |   |-- usePaymentFlow       Payment flow orchestration
    |   |   |-- useTheme             Theme colors & dark mode
    |   |
    |   |-- services/                API layer
    |   |   |-- api                  Axios instance & interceptors
    |   |   |-- mockApi              Mock API for development
    |   |   |-- mockData             Sample data for all screens
    |   |
    |   |-- constants/               Design tokens
    |   |   |-- colors               Gold (#C8850A), navy, status colors
    |   |   |-- spacing              Spacing scale & border radius
    |   |   |-- typography           Font sizes & weights
    |   |   |-- config               App configuration
    |   |   |-- indianStates         Indian states for address forms
    |   |
    |   |-- theme/                   Theme system
    |   |   |-- ThemeContext          React context
    |   |   |-- ThemeProvider         Dark/Light mode provider
    |   |   |-- themes               Color palettes
    |   |
    |   |-- types/                   TypeScript definitions
    |   |   |-- navigation           Stack param lists
    |   |   |-- loan, payment, user  Domain types
    |   |   |-- kyc, notification    Domain types
    |   |   |-- react-native-razorpay  Razorpay type declarations
    |   |
    |   |-- utils/                   Utility functions
    |       |-- emiCalculator        EMI math (reducing balance)
    |       |-- formatCurrency       Indian numbering (Rs 1,00,000)
    |       |-- formatDate           Date formatting with dayjs
    |       |-- formatPhone          Indian phone formatting
    |       |-- validators           Zod schemas
    |       |-- razorpay             Razorpay checkout helper
    |       |-- storage              MMKV/AsyncStorage wrapper
    |       |-- MotiCompat           Custom animation wrapper
    |
    |-- assets/                      App icons, splash screen, images
    |-- .eas/workflows/              EAS CI/CD workflow configs
    |-- app.json                     Expo configuration
    |-- eas.json                     EAS Build profiles
    |-- package.json                 Dependencies
    |-- tsconfig.json                TypeScript config
    |-- index.ts                     Entry point


---


## 4. Design System

    Primary Gold     : #C8850A
    Navy Gradient    : #0B1426, #132042, #1A2D5A
    Success Green    : #22C55E
    Error Red        : #EF4444
    Warning Amber    : #F59E0B

    Currency Format  : Indian numbering system (Rs 1,00,000)
    Border Radius    : 8px (small) / 12px (medium) / 16px (large) / 20px (card)


---


## 5. Key Features

    - Dark / Light theme with system preference detection
    - Indian currency formatting (lakh / crore notation)
    - Custom EMI calendar with color-coded payment dots
    - Circular progress rings for loan repayment tracking
    - Razorpay payment gateway (UPI, Cards, Net Banking)
    - Multi-step KYC verification flow
    - Haptic feedback on all interactions
    - Bottom sheet modals for payment flows
    - Animated screen transitions
    - 12 Indian language options
    - Custom toast notifications matching app theme


---


## 6. Payment Integration (Razorpay)

    SDK              : react-native-razorpay
    Mode             : Test (rzp_test_*)
    Supports         : UPI, Credit/Debit Cards, Net Banking
    Config File      : src/utils/razorpay.ts
    New Architecture : Enabled (required by Reanimated 4.x)

    Note: Razorpay requires a development build.
          It does not work in Expo Go.
          Use "eas build --profile development" for dev build with Razorpay.


---


## 7. Getting Started


### 7.1 Prerequisites

    Node.js          : 18+
    npm / yarn       : Latest
    Expo CLI         : npm install -g expo-cli
    EAS CLI          : npm install -g eas-cli
    Expo Go          : Install from Play Store / App Store (for quick testing)


### 7.2 Installation

    # 1. Clone the repository
    git clone https://github.com/akashffjdn/Money_lending.git
    cd Money_lending

    # 2. Install dependencies
    npm install

    # 3. Start the development server
    npx expo start


---


## 8. Running on Device


### 8.1 Same WiFi Network

    npx expo start

    Android : Open Expo Go app, scan the QR code
    iOS     : Open iPhone Camera, scan the QR code, opens in Expo Go


### 8.2 Different Network (Tunnel Mode)

    If your phone and PC are on different WiFi networks:

    npx expo start --tunnel

    This creates a public URL that works across any network.
    It will prompt to install @expo/ngrok on first run - type y to confirm.


### 8.3 Important Note About Expo Go

    Expo Go does NOT install the app on the device.
    It streams the app live from your PC.

    When you close the terminal, the app stops for everyone.

    For a permanent app that works without your PC running,
    you need to build an APK (Android) or IPA (iOS) using EAS Build.
    See section 9 below.


---


## 9. Building & Sharing the App


### 9.1 EAS Build Profiles

    Profile          Platform    Output          Use Case
    -------          --------    ------          --------
    preview          Android     .apk            Share with teammates for testing
    preview          iOS         Simulator       Test on iOS Simulator
    preview-device   iOS         .ipa (Ad Hoc)   Share with real iOS devices
    production       Both        .aab / .ipa     Play Store / App Store submission


### 9.2 Build Android APK (Shareable)

    # Step 1 : Login to EAS
    npx eas-cli login

    # Step 2 : Build APK
    eas build --platform android --profile preview

    # Step 3 : Get download link
    npx eas-cli build:list --platform android --limit 1

    Share the download URL with teammates.
    They install the APK and it works forever - no terminal needed.


### 9.3 Build iOS

    eas build --platform ios --profile preview-device

    Note: iOS builds require an Apple Developer Account ($99/year).
    There is no workaround. Apple does not allow installing apps
    on iPhones without a paid developer account.


### 9.4 Sharing Methods - Quick Comparison

    Method                      Permanent?    Terminal Needed?    Cost
    ------                      ----------    ---------------    ----
    Expo Go (tunnel link)       No            Yes                Free
    Android APK (EAS Build)     Yes           No                 Free
    iOS IPA (EAS Build)         Yes           No                 $99/year

    Recommendation:
    - Share the Android APK for permanent testing
    - Use Expo Go tunnel for quick iOS previews when you are online


---


## 10. EAS Workflows (CI/CD)

    Automated build pipelines are configured in .eas/workflows/

    File: .eas/workflows/build-preview.yml

    name: Build Preview (Android & iOS)

    jobs:
      build_android:
        type: build
        params:
          platform: android
          profile: preview

      build_ios:
        type: build
        params:
          platform: ios
          profile: preview-device


### Run manually:

    npx eas-cli workflow:run build-preview.yml


### Auto-trigger on push:

    Connect your GitHub repo at expo.dev > Project Settings > GitHub
    Then add to your workflow file:

    on:
      push:
        branches: ['master']


---


## 11. Environment

    Expo SDK         : 54
    React Native     : 0.81.5
    TypeScript       : 5.9.2
    New Architecture : Enabled
    Min Android SDK  : 24 (Android 7.0)
    Target SDK       : 36


---


## License

    Private - United Nexa Tech
