import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/admin_state.dart';
import 'screens/admin_dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase with the same credentials
  await Supabase.initialize(
    url: 'https://yzhqzerxqboswidsqnuk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aHF6ZXJ4cWJvc3dpZHNxbnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NDk1MjgsImV4cCI6MjA5ODEyNTUyOH0.j-bWhsNYGRHED9hYS8CtrTmvsH_0JwI2wC3O22mu26s',
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => AdminState()..loadBooks()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    const greenColor = Color(0xFF10B981);

    return MaterialApp(
      title: 'PrepAI Admin Portal',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B1325),
        primaryColor: greenColor,
        colorScheme: ColorScheme.dark(
          primary: greenColor,
          secondary: const Color(0xFF070B16),
          background: const Color(0xFF0B1325),
          surface: Colors.white.withOpacity(0.01),
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
          titleLarge: GoogleFonts.outfit(
            textStyle: ThemeData.dark().textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
          ),
          titleMedium: GoogleFonts.outfit(
            textStyle: ThemeData.dark().textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF070B16),
          elevation: 0,
          centerTitle: true,
        ),
      ),
      home: const AdminDashboard(),
    );
  }
}
