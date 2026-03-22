# DSA Tracker Mobile App

A comprehensive React Native mobile application for mastering Data Structures and Algorithms, built with **Expo SDK 53** and providing an identical UI/UX experience to the web version.

## 🚀 Features

### Core Functionality
- **375+ DSA Problems** - Comprehensive collection from easy to hard
- **Progress Tracking** - Detailed analytics and difficulty-based progress
- **AI Gaming Challenges** - Interactive coding challenges with AI feedback
- **Code Editor** - Multi-language code editor with execution
- **Study Timer** - Pomodoro-style timer with session tracking
- **Smart Notifications** - Professional notification schedule system

### Mobile-Optimized Features
- **Native Navigation** - Bottom tabs + drawer navigation
- **Touch-Friendly UI** - Optimized for mobile interactions
- **Offline Support** - Local storage with Supabase sync
- **Dark/Light Theme** - System-aware theme switching
- **Responsive Design** - Adapts to all screen sizes

### Authentication & Data
- **Supabase Integration** - Real-time data synchronization
- **Local Storage Fallback** - Works offline with sync when online
- **User Profiles** - Customizable profiles with progress tracking
- **Admin Panel** - Content management for admin users

## 📱 Screenshots

### Main Screens
- **Dashboard** - Overview with daily recommendations
- **Problems** - Filterable problem list with search
- **Gaming** - AI-powered coding challenges
- **Progress** - Detailed analytics and statistics
- **Profile** - User management and difficulty progress

### Additional Features
- **Code Editor** - Multi-language support (JS, Python, Java, C++, C)
- **Timer** - Study session tracking with statistics
- **Settings** - Notification preferences and app configuration
- **Admin** - Problem management for admin users

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe development
- **React Navigation** - Native navigation solution

### UI/UX
- **React Native Paper** - Material Design components
- **Expo Linear Gradient** - Beautiful gradient effects
- **React Native Animatable** - Smooth animations
- **Expo Vector Icons** - Comprehensive icon library

### Backend & Data
- **Supabase** - Backend-as-a-Service
- **AsyncStorage** - Local data persistence
- **Expo Notifications** - Push notification system
- **Expo Secure Store** - Secure credential storage

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (latest version)
- **Latest Expo Go** installed on your mobile device (SDK 53 compatible)
- Android Studio (for Android development)
- Xcode (for iOS development)

### Setup
1. **Clone the repository**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure environment variables**
   ```bash
   # Create .env file
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device with Expo Go (Latest)**
   ```bash
   # Scan QR code with Expo Go app
   # Compatible with Expo SDK 53
   
   # Alternative: Run on specific platform
   npm run android  # Android emulator
   npm run ios      # iOS simulator
   npm run web      # Web browser (for testing)
   ```

### Expo Go Setup (SDK 53 Compatible)
1. **Download the latest Expo Go** from your device's app store
2. **Start the development server** with `npm start`
3. **Scan the QR code** displayed in the terminal or browser
4. **The app will load** in Expo Go on your device

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── problems/        # Problem-related components
│   │   └── ui/             # Generic UI components
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── ThemeContext.tsx # Theme management
│   ├── data/               # Data models and utilities
│   │   └── dsaDatabase.ts  # DSA problems data
│   ├── hooks/              # Custom React hooks
│   │   ├── useOptimizedAnalytics.ts
│   │   └── useNotifications.ts
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── DashboardScreen.tsx
│   │   ├── ProblemsScreen.tsx
│   │   ├── GamingScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── CodeEditorScreen.tsx
│   │   ├── TimerScreen.tsx
│   │   └── AdminScreen.tsx
│   ├── services/           # Business logic and API calls
│   │   ├── SupabaseAuthService.ts
│   │   ├── ProblemProgressService.ts
│   │   ├── NotificationService.ts
│   │   ├── TimeTrackingService.ts
│   │   ├── UserSessionService.ts
│   │   └── SimpleDataSync.ts
│   └── utils/              # Utility functions
│       └── appInitializer.ts
├── assets/                 # Static assets
├── App.tsx                 # Root component
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

## 🔧 Configuration

### Supabase Setup
1. Create a Supabase project
2. Set up authentication
3. Create required tables:
   - `profiles` - User profiles
   - `problem_progress` - Problem completion tracking
   - `user_sessions` - Daily session data
   - `time_sessions` - Timer session tracking

### Notification Setup
1. Configure Expo notifications
2. Set up notification channels (Android)
3. Configure notification permissions

## 📊 Key Features Explained

### Progressive Recommendations
- AI-powered daily problem recommendations
- Difficulty-based progression
- Personalized based on user progress

### Analytics & Progress Tracking
- Real-time progress analytics
- Difficulty-based statistics
- Weekly and daily progress tracking
- Streak calculation and maintenance

### Notification System
- Professional daily reminder schedule
- Customizable notification times
- Achievement and streak notifications
- Background notification support

### Data Synchronization
- Real-time sync with Supabase
- Offline-first architecture
- Automatic conflict resolution
- Local storage fallback

## 🎨 UI/UX Design

### Design Principles
- **Mobile-First** - Designed specifically for mobile devices
- **Touch-Friendly** - Minimum 44px touch targets
- **Consistent** - Unified design language throughout
- **Accessible** - Proper contrast ratios and focus states

### Theme System
- **Light/Dark Mode** - System-aware theme switching
- **Color Palette** - Consistent color scheme
- **Typography** - Readable font sizes and weights
- **Spacing** - Consistent spacing system

### Animations
- **Smooth Transitions** - 200-300ms duration
- **Loading States** - Skeleton screens and spinners
- **Micro-Interactions** - Button press feedback
- **Page Transitions** - Native navigation animations

## 🔐 Security

### Authentication
- Supabase Auth integration
- Secure token storage
- Automatic session refresh
- OAuth support (Google)

### Data Protection
- Encrypted local storage
- Secure API communication
- User data privacy
- GDPR compliance ready

## 📈 Performance

### Optimization Strategies
- **Lazy Loading** - Components loaded on demand
- **Caching** - Intelligent data caching
- **Image Optimization** - Optimized asset delivery
- **Bundle Splitting** - Reduced initial load time

### Analytics Integration
- User engagement tracking
- Performance monitoring
- Crash reporting
- Usage analytics

## 🚀 Deployment

### Build Configuration
```bash
# Development build
expo build:android --type apk
expo build:ios --type simulator

# Production build
expo build:android --type app-bundle
expo build:ios --type archive
```

### App Store Deployment
1. Configure app.json for production
2. Generate production builds
3. Upload to respective app stores
4. Configure store listings

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review process

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help
- Check the documentation
- Search existing issues
- Create new issue with details
- Join community discussions

### Common Issues
- **Build Errors** - Check Node.js version and dependencies
- **Supabase Connection** - Verify environment variables
- **Navigation Issues** - Check React Navigation setup
- **Notification Problems** - Verify permissions and setup

## 🎯 Roadmap

### Upcoming Features
- [ ] Offline problem solving
- [ ] Social features and leaderboards
- [ ] Advanced analytics dashboard
- [ ] Custom problem creation
- [ ] Video tutorials integration
- [ ] Collaborative coding sessions

### Performance Improvements
- [ ] Advanced caching strategies
- [ ] Background sync optimization
- [ ] Memory usage optimization
- [ ] Battery usage optimization

---

**Built with ❤️ for developers who want to excel in coding interviews**

This React Native mobile app provides the exact same functionality and user experience as the web version, optimized specifically for mobile devices with native performance and mobile-first design principles.
