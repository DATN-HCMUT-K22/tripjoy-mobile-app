# Tripjoy - Ứng Dụng Lập Kế Hoạch Du Lịch

Tripjoy là một ứng dụng di động đa nền tảng giúp người dùng lập kế hoạch du lịch, chia sẻ trải nghiệm và tương tác với cộng đồng du lịch.

## 📱 Công Nghệ Sử Dụng

Dự án được xây dựng với:

- **React Native** 0.81.5 - Framework phát triển ứng dụng di động
- **Expo** ~54.0.25 - Platform và tooling cho React Native
- **TypeScript** ~5.9.2 - Type-safe JavaScript
- **Expo Router** ~6.0.15 - File-based routing

### Thư Viện Chính

- **Navigation**: Expo Router, React Navigation
- **UI/Styling**: NativeWind, Tailwind CSS
- **Form**: React Hook Form, Yup
- **Maps**: Mapbox (@rnmapbox/maps)
- **Animation**: React Native Reanimated
- **Storage**: AsyncStorage
- **Icons**: Expo Vector Icons
- **Toast**: react-native-toast-message

Xem chi tiết tại [docs/FRONTEND_TECHNOLOGY.md](./docs/FRONTEND_TECHNOLOGY.md)

---

## 🚀 Bắt Đầu

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   Hoặc chạy với development client:

   ```bash
   npx expo start --dev-client
   ```

   **Lưu ý**: Development client cho phép bạn sử dụng các native modules và tính năng không có sẵn trong Expo Go.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

```
datn_tripjoy
├─ .env
├─ app
│  ├─ (tabs)
│  │  ├─ explore.tsx
│  │  ├─ index.tsx
│  │  └─ _layout.tsx
│  ├─ create
│  │  ├─ add-location.tsx
│  │  ├─ adjust-itinerary.tsx
│  │  ├─ budget.tsx
│  │  ├─ edit-itinerary.tsx
│  │  ├─ index.tsx
│  │  ├─ manual.tsx
│  │  ├─ select-group.tsx
│  │  ├─ summary.tsx
│  │  └─ time.tsx
│  ├─ groups
│  │  ├─ create.tsx
│  │  ├─ index.tsx
│  │  ├─ [id]
│  │  │  └─ info.tsx
│  │  └─ [id].tsx
│  ├─ login.tsx
│  ├─ messages.tsx
│  ├─ modal.tsx
│  ├─ signup.tsx
│  └─ _layout.tsx
├─ app.config.js
├─ app.json
├─ assets
│  ├─ icons
│  │  └─ GoogleIcon.svg
│  ├─ images
│  │  ├─ ai-itinerary.png
│  │  ├─ ai-logo.jpg
│  │  ├─ favicon.png
│  │  ├─ icon.png
│  │  ├─ landing_page_1.png
│  │  ├─ landing_page_2.png
│  │  ├─ landing_page_3.png
│  │  ├─ loading_img.jpg
│  │  ├─ loading_img_2.jpg
│  │  ├─ loading_img_3.jpg
│  │  ├─ login_logo.jpg
│  │  ├─ partial-react-logo.png
│  │  ├─ react-logo.png
│  │  ├─ react-logo@2x.png
│  │  ├─ react-logo@3x.png
│  │  ├─ signup_logo.jpg
│  │  └─ splash-icon.png
│  └─ logo
│     ├─ black_black.png
│     ├─ green.png
│     ├─ green_black_black.png
│     ├─ green_black_hori.png
│     ├─ Logo.png
│     └─ white_white.png
├─ babel.config.js
├─ components
│  ├─ auth
│  │  └─ SignupScreen.tsx
│  ├─ common
│  │  ├─ Input.tsx
│  │  └─ LoginRequiredModal.tsx
│  ├─ external-link.tsx
│  ├─ group
│  │  ├─ ContactItem.tsx
│  │  ├─ CreateGroupModal.tsx
│  │  ├─ GroupCard.tsx
│  │  ├─ GroupListItem.tsx
│  │  ├─ index.ts
│  │  ├─ ItineraryCard.tsx
│  │  └─ ItineraryListItem.tsx
│  ├─ haptic-tab.tsx
│  ├─ hello-wave.tsx
│  ├─ icons
│  │  └─ GoogleIcon.tsx
│  ├─ InteractiveMap.tsx
│  ├─ InteractiveMap.web.tsx
│  ├─ loading
│  │  ├─ index.ts
│  │  ├─ LoadingScreen.tsx
│  │  ├─ README.md
│  │  └─ SplashLoadingScreen.tsx
│  ├─ LoadingOverlay.tsx
│  ├─ onboarding
│  │  ├─ index.ts
│  │  └─ Onboarding.js
│  ├─ parallax-scroll-view.tsx
│  ├─ social
│  │  ├─ BottomNavigation.tsx
│  │  ├─ Header.tsx
│  │  ├─ index.ts
│  │  ├─ PostCard.tsx
│  │  ├─ SearchBar.tsx
│  │  ├─ SocialHeader.tsx
│  │  └─ TabMenu.tsx
│  ├─ themed-text.tsx
│  ├─ themed-view.tsx
│  ├─ TimePickerModal.tsx
│  ├─ trip
│  │  ├─ BudgetItem.tsx
│  │  ├─ index.ts
│  │  ├─ LocationItem.tsx
│  │  ├─ SectionHeader.tsx
│  │  └─ SimpleCalendar.tsx
│  └─ ui
│     ├─ AppHeader.tsx
│     ├─ Button.tsx
│     ├─ collapsible.tsx
│     ├─ icon-symbol.ios.tsx
│     ├─ icon-symbol.tsx
│     ├─ index.ts
│     ├─ RouteIcon.tsx
│     └─ VietnamFlag.tsx
├─ config
│  └─ env.ts
├─ constants
│  └─ theme.ts
├─ contexts
│  ├─ ItineraryContext.tsx
│  ├─ TempLocationContext.tsx
│  └─ TripSetupContext.tsx
├─ data
│  ├─ budgetOptions.ts
│  ├─ mockAttractions.ts
│  ├─ mockContacts.ts
│  ├─ mockGroups.ts
│  ├─ mockItineraries.ts
│  ├─ mockItineraryItems.ts
│  ├─ mockLocations.ts
│  ├─ mockPosts.ts
│  └─ tripTypeOptions.ts
├─ docs
│  ├─ FRONTEND_TECHNOLOGY.md
│  ├─ FRONTEND_TECHNOLOGY_LATEX.tex
│  ├─ MAPBOX_GUIDE.md
│  └─ SOCKET_IO_CLIENT_GUIDE.md
├─ eas.json
├─ eslint.config.js
├─ global.css
├─ hooks
│  ├─ use-color-scheme.ts
│  ├─ use-color-scheme.web.ts
│  ├─ use-theme-color.ts
│  ├─ useAuth.ts
│  ├─ useAuthLogger.ts
│  ├─ useGroups.ts
│  ├─ useLoginForm.ts
│  ├─ useRequireAuth.ts
│  ├─ useSignupForm.ts
│  ├─ useSocket.ts
│  └─ useUsers.ts
├─ metro.config.js
├─ nativewind-env.d.ts
├─ package-lock.json
├─ package.json
├─ README.md
├─ scripts
│  └─ reset-project.js
├─ services
│  ├─ auth.ts
│  ├─ groups.ts
│  ├─ http
│  │  └─ client.ts
│  ├─ itineraries.ts
│  ├─ locations.ts
│  ├─ socket
│  │  └─ socketService.ts
│  └─ users.ts
├─ store
│  ├─ hooks.ts
│  ├─ index.ts
│  └─ slices
│     └─ authSlice.ts
├─ tailwind.config.js
├─ tsconfig.json
├─ types
│  ├─ axios.d.ts
│  ├─ contact.ts
│  ├─ env.d.ts
│  ├─ group.ts
│  ├─ itinerary.ts
│  ├─ social.ts
│  ├─ svg.d.ts
│  ├─ trip.ts
│  └─ user.ts
└─ utils
   ├─ format.ts
   ├─ mapbox.ts
   └─ storage.ts

```