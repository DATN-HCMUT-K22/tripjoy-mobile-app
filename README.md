# Tripjoy - Ứng Dụng Lập Kế Hoạch Du Lịch

Tripjoy là một ứng dụng di động đa nền tảng giúp người dùng lập kế hoạch du lịch, chia sẻ trải nghiệm và tương tác với cộng đồng du lịch.

## ✨ Tính Năng Nổi Bật

- **Lập Kế Hoạch Thông Minh:** Tạo hành trình tự động bằng AI hoặc thủ công
- **Check-in Tại Điểm Đến:** Đánh dấu địa điểm đã thăm, hoạt động cả offline
- **Đánh Giá & Nhận Xét:** Đánh giá sao (1-5) và viết review cho địa điểm đã check-in
- **Quản Lý Chi Phí:** Theo dõi chi tiêu chi tiết, liên kết với điểm đến, upload hóa đơn
- **Geofencing:** Nhận thông báo tự động khi gần điểm trong hành trình (tùy chọn)
- **Làm Việc Offline:** Check-in và xem hành trình mà không cần internet, tự động đồng bộ
- **Mạng Xã Hội Du Lịch:** Chia sẻ hành trình, tương tác với cộng đồng
- **Nhóm & Chat:** Lập kế hoạch cùng bạn bè, trò chuyện nhóm real-time
- **Sổ Tay Du Lịch:** Tự động tạo nhật ký chuyến đi bằng AI

Xem chi tiết tại [docs/SMART_ITINERARY_FEATURES.md](./docs/SMART_ITINERARY_FEATURES.md)

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
```
datn_tripjoy
├─ .claude
│  ├─ brainstorm
│  ├─ plans
│  │  ├─ chat-share-reply-enhancement
│  │  │  ├─ phase-1-shared-post-card.md
│  │  │  ├─ phase-2-enhanced-reply.md
│  │  │  ├─ phase-3-thread-navigation.md
│  │  │  ├─ phase-4-polish-testing.md
│  │  │  └─ plan.md
│  │  ├─ chat-ui-ux-improvement-20260420
│  │  │  ├─ phase-1-critical-fixes.md
│  │  │  ├─ phase-2-connection-status.md
│  │  │  ├─ phase-3-message-optimization.md
│  │  │  ├─ phase-4-typing-indicators.md
│  │  │  ├─ phase-5-swipe-actions.md
│  │  │  ├─ phase-6-inbox-ui-polish.md
│  │  │  ├─ plan.md
│  │  │  └─ README.md
│  │  ├─ group-ui-ux-improvement
│  │  │  ├─ phase-1.md
│  │  │  ├─ phase-2.md
│  │  │  ├─ phase-3.md
│  │  │  ├─ phase-4.md
│  │  │  ├─ phase-5.md
│  │  │  ├─ phase-6.md
│  │  │  ├─ phase-7.md
│  │  │  └─ plan.md
│  │  ├─ itinerary-implementation
│  │  │  ├─ phase-1.md
│  │  │  ├─ phase-2.md
│  │  │  ├─ phase-3.md
│  │  │  ├─ phase-4.md
│  │  │  ├─ phase-5.md
│  │  │  ├─ phase-6.md
│  │  │  ├─ phase-7.md
│  │  │  └─ plan.md
│  │  ├─ nearby-suggestions-feature-20260426
│  │  │  ├─ phase-1-core-mvp.md
│  │  │  ├─ phase-2-polish.md
│  │  │  ├─ phase-3-enhancement.md
│  │  │  ├─ plan.md
│  │  │  └─ README.md
│  │  ├─ post-module-implementation
│  │  │  ├─ API_DOCUMENTATION.md
│  │  │  ├─ IMPLEMENTATION_SUMMARY.md
│  │  │  ├─ phase-1-core-creation.md
│  │  │  ├─ phase-1-implementation-summary.md
│  │  │  ├─ phase-2-itinerary-management.md
│  │  │  ├─ phase-3-discovery-search.md
│  │  │  ├─ phase-4-architecture.md
│  │  │  ├─ phase-4-COMPLETED.md
│  │  │  ├─ phase-4-social-interactions.md
│  │  │  ├─ phase-5-notifications.md
│  │  │  ├─ phase-6-COMPLETED.md
│  │  │  ├─ phase-6-optimization.md
│  │  │  ├─ PHASE-6-TESTING.md
│  │  │  ├─ phase-7-private-visibility.md
│  │  │  ├─ plan.md
│  │  │  ├─ privacy-verification-checklist.md
│  │  │  └─ README.md
│  │  ├─ travel-notebook-fe-implementation
│  │  │  ├─ phase-1-core-infrastructure.md
│  │  │  ├─ phase-2-fake-progress.md
│  │  │  ├─ phase-3-ui-components.md
│  │  │  ├─ phase-4-main-screen.md
│  │  │  ├─ phase-5-integration.md
│  │  │  ├─ plan.md
│  │  │  └─ README.md
│  │  └─ user-profile-feature-20260426
│  │     ├─ phase-1-core-structure.md
│  │     ├─ phase-2-shared-components.md
│  │     ├─ phase-3-main-screen.md
│  │     ├─ phase-4-navigation.md
│  │     ├─ phase-5-testing-polish.md
│  │     └─ plan.md
│  └─ settings.local.json
├─ .cursor
│  ├─ plan
│  │  └─ implementation.md
│  ├─ rules
│  │  ├─ error-ui-consistency.mdc
│  │  └─ safe-area-screens.mdc
│  └─ skills
│     └─ group-detail-itineraries
│        └─ SKILL.md
├─ ANDROID_QUICKSTART.md
├─ app
│  ├─ (tabs)
│  │  ├─ explore.tsx
│  │  ├─ index.tsx
│  │  └─ _layout.tsx
│  ├─ chat
│  │  └─ [id].tsx
│  ├─ create
│  │  ├─ add-location.tsx
│  │  ├─ adjust-itinerary.tsx
│  │  ├─ ai-wait.tsx
│  │  ├─ budget.tsx
│  │  ├─ edit-itinerary.tsx
│  │  ├─ index.tsx
│  │  ├─ manual.tsx
│  │  ├─ select-group.tsx
│  │  ├─ summary.tsx
│  │  ├─ time.tsx
│  │  └─ _layout.tsx
│  ├─ create-post.tsx
│  ├─ edit-post
│  │  └─ [id].tsx
│  ├─ groups
│  │  ├─ create-wizard.tsx
│  │  ├─ create.tsx
│  │  ├─ index.tsx
│  │  ├─ [id]
│  │  │  ├─ chat.tsx
│  │  │  ├─ edit.tsx
│  │  │  ├─ index.tsx
│  │  │  ├─ info.tsx
│  │  │  ├─ itineraries.tsx
│  │  │  ├─ members.tsx
│  │  │  ├─ suggestions.tsx
│  │  │  └─ _layout.tsx
│  │  └─ _layout.tsx
│  ├─ itinerary
│  │  ├─ detail.tsx
│  │  ├─ expenses.tsx
│  │  ├─ index.tsx
│  │  ├─ notebook.tsx
│  │  ├─ [id].tsx
│  │  └─ _layout.tsx
│  ├─ login.tsx
│  ├─ messages.tsx
│  ├─ modal.tsx
│  ├─ notifications.tsx
│  ├─ post
│  │  └─ [id].tsx
│  ├─ profile
│  │  ├─ edit.tsx
│  │  ├─ index.tsx
│  │  ├─ saved.tsx
│  │  ├─ update-user.tsx
│  │  └─ _layout.tsx
│  ├─ select-itinerary.tsx
│  ├─ settings
│  │  └─ privacy.tsx
│  ├─ signup.tsx
│  ├─ user
│  │  └─ [id].tsx
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
│     ├─ ai_bot.webp
│     ├─ black_black.png
│     ├─ green.png
│     ├─ green_black_black.png
│     ├─ green_black_hori.png
│     ├─ Logo.png
│     └─ white_white.png
├─ babel.config.js
├─ brain-storm
│  ├─ brainstorm-group-module-ui-ux-2026-04-20.md
│  ├─ BRAINSTORM_TRAVEL_NOTEBOOK_UX.md
│  ├─ FE_ITINERARY_BUSINESS.md
│  ├─ FE_TRAVEL_NOTEBOOK_BUSINESS.md
│  ├─ MOBILE_CHAT_UX_IMPROVEMENT_ROADMAP_2026-04-20.md
│  ├─ POST_BUSINESS_SPEC.md
│  └─ user-profile-feature-2026-04-26.md
├─ brainstorm
│  └─ CHAT_SHARE_REPLY_FEATURES_2026-05-07.md
├─ components
│  ├─ auth
│  │  └─ SignupScreen.tsx
│  ├─ chat
│  │  ├─ ChatBubble.tsx
│  │  ├─ ConnectionBanner.tsx
│  │  ├─ DateSeparator.tsx
│  │  ├─ MentionSuggestions.tsx
│  │  ├─ MessageActionSheet.tsx
│  │  ├─ MessageLikesModal.tsx
│  │  ├─ MessageNotificationBanner.tsx
│  │  ├─ MessageNotificationProvider.tsx
│  │  ├─ MessageSearchModal.tsx
│  │  ├─ PinnedMessageBar.tsx
│  │  ├─ PinnedMessageItem.tsx
│  │  ├─ PinnedMessagesModal.tsx
│  │  ├─ SharedPostCard.tsx
│  │  ├─ TypingIndicator.tsx
│  │  └─ TypingIndicatorBubble.tsx
│  ├─ common
│  │  ├─ AppBottomSheet.tsx
│  │  ├─ AppDialogModal.tsx
│  │  ├─ ConfirmLogoutModal.tsx
│  │  ├─ ErrorBoundary.tsx
│  │  ├─ FullScreenLoading.tsx
│  │  ├─ Input.tsx
│  │  ├─ LoginRequiredModal.tsx
│  │  ├─ MenuDrawer.tsx
│  │  └─ SharedHeader.tsx
│  ├─ conversation
│  │  ├─ ConversationAvatar.tsx
│  │  ├─ ConversationSkeleton.tsx
│  │  ├─ index.ts
│  │  ├─ SwipeableConversationItem.tsx
│  │  └─ UnreadBadge.tsx
│  ├─ create-post
│  │  └─ AttachedMediaGalleryModal.tsx
│  ├─ errors
│  │  ├─ ErrorBoundary.tsx
│  │  └─ ErrorFallback.tsx
│  ├─ external-link.tsx
│  ├─ group
│  │  ├─ ContactItem.tsx
│  │  ├─ CreateGroupModal.tsx
│  │  ├─ GroupCard.tsx
│  │  ├─ GroupHeader.tsx
│  │  ├─ GroupListItem.tsx
│  │  ├─ index.ts
│  │  ├─ ItineraryCard.tsx
│  │  ├─ ItineraryListItem.tsx
│  │  ├─ LocationSuggestionsSection.tsx
│  │  ├─ MemberCard.tsx
│  │  ├─ QuickAccessCard.tsx
│  │  ├─ RolePermissionsSheet.tsx
│  │  └─ SwipeableGroupCard.tsx
│  ├─ haptic-tab.tsx
│  ├─ hello-wave.tsx
│  ├─ icons
│  │  └─ GoogleIcon.tsx
│  ├─ InteractiveMap.tsx
│  ├─ InteractiveMap.web.tsx
│  ├─ itinerary
│  │  ├─ DraggableApiItineraryItemCard.tsx
│  │  ├─ ExpensesOverlay.tsx
│  │  ├─ ItineraryRouteMap.tsx
│  │  ├─ StatusBadge.tsx
│  │  └─ TripItemCard.tsx
│  ├─ loading
│  │  ├─ index.ts
│  │  ├─ LoadingScreen.tsx
│  │  ├─ README.md
│  │  ├─ SimpleLogoLoading.tsx
│  │  └─ SplashLoadingScreen.tsx
│  ├─ LoadingOverlay.tsx
│  ├─ location
│  │  └─ LocationImage.tsx
│  ├─ notebook
│  │  ├─ EmptyState.tsx
│  │  ├─ GeneratingState.tsx
│  │  ├─ NotebookContent.tsx
│  │  ├─ NotebookSection.tsx
│  │  └─ TravelNotebookScreen.tsx
│  ├─ onboarding
│  │  ├─ index.ts
│  │  └─ Onboarding.js
│  ├─ parallax-scroll-view.tsx
│  ├─ post
│  ├─ profile
│  │  ├─ PostsGrid.tsx
│  │  ├─ ProfileActions.tsx
│  │  ├─ ProfileHeader.tsx
│  │  ├─ ProfileSkeleton.tsx
│  │  └─ ProfileStats.tsx
│  ├─ shared
│  │  ├─ EmptyState.tsx
│  │  └─ LoadingSkeleton.tsx
│  ├─ social
│  │  ├─ BottomNavigation.tsx
│  │  ├─ CommentInput.tsx
│  │  ├─ CommentItem.tsx
│  │  ├─ CommentModal.tsx
│  │  ├─ filters
│  │  │  ├─ BudgetRangeSlider.tsx
│  │  │  ├─ DateRangePicker.tsx
│  │  │  ├─ DurationFilter.tsx
│  │  │  ├─ FilterModal.tsx
│  │  │  ├─ HashtagSelector.tsx
│  │  │  ├─ index.ts
│  │  │  └─ PeopleCountFilter.tsx
│  │  ├─ HashtagList.tsx
│  │  ├─ Header.tsx
│  │  ├─ index.ts
│  │  ├─ PostActionsMenu.tsx
│  │  ├─ PostCard.tsx
│  │  ├─ PostCardSkeleton.tsx
│  │  ├─ SearchBar.tsx
│  │  ├─ ShareModal.tsx
│  │  ├─ SocialHeader.tsx
│  │  └─ TabMenu.tsx
│  ├─ themed-text.tsx
│  ├─ themed-view.tsx
│  ├─ TimePickerModal.tsx
│  ├─ trip
│  │  ├─ BudgetItem.tsx
│  │  ├─ BudgetManualRange.tsx
│  │  ├─ index.ts
│  │  ├─ LocationItem.tsx
│  │  ├─ SectionHeader.tsx
│  │  └─ SimpleCalendar.tsx
│  └─ ui
│     ├─ AppHeader.tsx
│     ├─ AvatarStack.tsx
│     ├─ Button.tsx
│     ├─ collapsible.tsx
│     ├─ GroupCardSkeleton.tsx
│     ├─ icon-symbol.ios.tsx
│     ├─ icon-symbol.tsx
│     ├─ index.ts
│     ├─ MemberCardSkeleton.tsx
│     ├─ RoleBadge.tsx
│     ├─ RouteIcon.tsx
│     └─ VietnamFlag.tsx
├─ config
│  └─ env.ts
├─ constants
│  ├─ errorCodes.ts
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
│  ├─ sampleProvinceLocations.ts
│  └─ tripTypeOptions.ts
├─ eas.json
├─ eslint.config.js
├─ fix-bundling.md
├─ global.css
├─ hooks
│  ├─ use-color-scheme.ts
│  ├─ use-color-scheme.web.ts
│  ├─ use-theme-color.ts
│  ├─ useAppDialog.ts
│  ├─ useAuth.ts
│  ├─ useAuthLogger.ts
│  ├─ useComments.ts
│  ├─ useConversations.ts
│  ├─ useCreateTripExitToHome.ts
│  ├─ useCurrentUser.ts
│  ├─ useDebounce.ts
│  ├─ useExpenses.ts
│  ├─ useFakeProgress.ts
│  ├─ useGroupPreferences.ts
│  ├─ useGroups.ts
│  ├─ useGuestMode.ts
│  ├─ useIncomingMessage.ts
│  ├─ useIncomingNotification.ts
│  ├─ useItineraries.ts
│  ├─ useLocationSuggestions.ts
│  ├─ useLoginForm.ts
│  ├─ useManualUserLocation.ts
│  ├─ useMessages.ts
│  ├─ useNotebook.ts
│  ├─ useNotifications.ts
│  ├─ usePinnedMessages.ts
│  ├─ usePostManagement.ts
│  ├─ useProvinceLocations.ts
│  ├─ useRequireAuth.ts
│  ├─ useSignupForm.ts
│  ├─ useSocial.ts
│  ├─ useSocket.ts
│  ├─ useSocketTyping.ts
│  ├─ useTripItems.ts
│  ├─ useUserPosts.ts
│  ├─ useUserProfile.ts
│  ├─ useUsers.ts
│  └─ useUserSearchDebounce.ts
├─ metro.config.js
├─ nativewind-env.d.ts
├─ package-lock.json
├─ package.json
├─ plans
│  ├─ expense_implementation_plan.md
│  ├─ refactor-itinerary-detail-ui-ORIGINAL.md
│  ├─ refactor-itinerary-detail-ui.md
│  └─ social-post-comments-mvp-2026-04-16.md
├─ plugins
│  └─ withGoogleMapsNativeApiKey.js
├─ README.md
├─ schemas
│  └─ itinerary.ts
├─ screens
│  └─ notifications
│     ├─ components
│     │  ├─ EmptyState.tsx
│     │  ├─ NotificationItem.tsx
│     │  └─ NotificationSkeleton.tsx
│     └─ NotificationScreen.tsx
├─ scripts
│  └─ reset-project.js
├─ services
│  ├─ auth.ts
│  ├─ comment.ts
│  ├─ conversations.ts
│  ├─ googleDistanceMatrix.ts
│  ├─ googlePlaces.ts
│  ├─ groups.ts
│  ├─ http
│  │  └─ client.ts
│  ├─ itineraries.ts
│  ├─ locations.ts
│  ├─ locationSuggestions.ts
│  ├─ media.ts
│  ├─ messages.ts
│  ├─ notebooks.ts
│  ├─ notification.service.ts
│  ├─ notifications.ts
│  ├─ README.md
│  ├─ search.ts
│  ├─ social.ts
│  ├─ socket
│  │  └─ socketService.ts
│  └─ users.ts
├─ store
│  ├─ hooks.ts
│  ├─ index.ts
│  └─ slices
│     ├─ authSlice.ts
│     ├─ conversationSlice.ts
│     ├─ messageNotificationSlice.ts
│     └─ notificationSlice.ts
├─ stores
│  └─ chat.store.ts
├─ tailwind.config.js
├─ tripjoy-ai-service
│  └─ credentials.json
├─ tsconfig.json
├─ types
│  ├─ axios.d.ts
│  ├─ comment.ts
│  ├─ contact.ts
│  ├─ env.d.ts
│  ├─ group.ts
│  ├─ itinerary.ts
│  ├─ locationSuggestion.ts
│  ├─ message.ts
│  ├─ notebook.ts
│  ├─ places.ts
│  ├─ search.ts
│  ├─ social.ts
│  ├─ svg.d.ts
│  ├─ trip.ts
│  └─ user.ts
└─ utils
   ├─ aiItineraryGenerate.ts
   ├─ analytics.ts
   ├─ appStateManager.ts
   ├─ conversationDisplay.ts
   ├─ format.ts
   ├─ googlePlaceImageSource.ts
   ├─ googlePlacePhoto.ts
   ├─ googleStaticMap.ts
   ├─ haptics.ts
   ├─ haversine.ts
   ├─ image.ts
   ├─ itineraryDates.ts
   ├─ itineraryThemes.ts
   ├─ locationImages.ts
   ├─ manualTravelTimes.ts
   ├─ mapLocationDtoToTrip.ts
   ├─ mapLocations.ts
   ├─ mappers.ts
   ├─ messageDeduplication.ts
   ├─ notebookCache.ts
   ├─ pendingItinerarySelection.ts
   ├─ placeItinerary.ts
   ├─ resolveItineraryCoords.ts
   ├─ roleUtils.ts
   ├─ staticMapUrl.ts
   ├─ storage
   │  └─ groupPreferences.ts
   ├─ storage.ts
   ├─ timeFormat.ts
   ├─ timeRange.ts
   ├─ toast.ts
   └─ userAvatar.ts

```