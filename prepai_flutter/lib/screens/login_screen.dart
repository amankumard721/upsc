import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:truecaller_sdk/truecaller_sdk.dart';
import 'dart:async';
import '../providers/app_state.dart';
import 'main_navigation.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  
  bool _isSignUp = false;
  bool _obscurePassword = true;
  bool _loading = false;
  bool _truecallerAvailable = false;
  
  // Form controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _inviteController = TextEditingController();
  
  String _selectedExam = 'JTET Paper I';
  final List<String> _exams = [
    'JTET Paper I (Class 1-5)',
    'JTET Paper II (Class 6-8)',
    'CTET & Teaching Exams',
    'SSC CGL & Allied Exams',
  ];

  StreamSubscription? _truecallerSubscription;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    // Animation controller for premium entrance effects
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _animationController.forward();

    _initTruecaller();
  }

  void _initTruecaller() async {
    try {
      // Initialize Truecaller SDK
      TcSdk.initializeSDK(sdkOption: TcSdkOptions.OPTION_VERIFY_ONLY_TC_USERS);
      
      // Check if Truecaller app is active/usable
      bool usable = await TcSdk.isOAuthFlowUsable;
      setState(() {
        _truecallerAvailable = usable;
      });

      // Listen for callbacks
      _truecallerSubscription = TcSdk.streamCallbackData.listen((event) {
        final sdkCallback = event as TcSdkCallback;
        if (sdkCallback.result == TcSdkCallbackResult.success) {
          _handleTruecallerSuccess(sdkCallback);
        } else if (sdkCallback.result == TcSdkCallbackResult.failure) {
          setState(() => _loading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
              content: Text('Truecaller failed: ${sdkCallback.error?.message ?? "User cancelled"}'),
            ),
          );
        }
      });
    } catch (e) {
      print('Truecaller SDK init error: $e');
    }
  }

  Future<void> _verifyWithTruecaller() async {
    setState(() => _loading = true);
    try {
      bool isUsable = await TcSdk.isOAuthFlowUsable;
      if (isUsable) {
        TcSdk.setOAuthState("jtet-sathi-oauth-state-token");
        TcSdk.setOAuthScopes(['profile', 'phone', 'openid']);
        
        final codeVerifier = await TcSdk.generateRandomCodeVerifier;
        final codeChallenge = await TcSdk.generateCodeChallenge(codeVerifier);
        if (codeChallenge != null) {
          TcSdk.setCodeChallenge(codeChallenge);
          await TcSdk.getAuthorizationCode;
        } else {
          setState(() => _loading = false);
          _showSnackBar('Could not generate Truecaller challenge.', Colors.redAccent);
        }
      } else {
        setState(() => _loading = false);
        _showSnackBar('Truecaller app is not installed or active on this device.', Colors.amber);
      }
    } catch (e) {
      setState(() => _loading = false);
      _showSnackBar('Truecaller error: $e', Colors.redAccent);
    }
  }

  Future<void> _handleTruecallerSuccess(TcSdkCallback event) async {
    final state = Provider.of<AppState>(context, listen: false);
    const name = "Truecaller User";

    try {
      await state.initialize();
      if (state.profile != null) {
        await state.updateProfileName(name);
      }
    } catch (e) {
      print('Truecaller login profile setup error: $e');
    }
    
    setState(() => _loading = false);
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigation()),
      );
    }
  }

  Future<void> _handleAuthSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _loading = true);
    final state = Provider.of<AppState>(context, listen: false);

    bool success = false;
    try {
      if (_isSignUp) {
        success = await state.signUpWithEmail(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
          fullName: _nameController.text.trim(),
          examType: _selectedExam,
          inviteCode: _inviteController.text.trim(),
        );
      } else {
        success = await state.signInWithEmail(
          _emailController.text.trim(),
          _passwordController.text.trim(),
        );
      }
    } catch (e) {
      print('Auth error: $e');
    }

    setState(() => _loading = false);

    if (success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigation()),
      );
    } else if (mounted) {
      _showAuthErrorDialog();
    }
  }

  Future<void> _handleBypassDemo() async {
    setState(() => _loading = true);
    final state = Provider.of<AppState>(context, listen: false);
    await state.initialize();
    setState(() => _loading = false);
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigation()),
      );
    }
  }

  void _showSnackBar(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
      ),
    );
  }

  void _showAuthErrorDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF070B16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Colors.redAccent, width: 1),
        ),
        title: const Row(
          children: [
            Icon(Icons.error_outline_rounded, color: Colors.redAccent),
            SizedBox(width: 8),
            Text(
              'Authentication Failed',
              style: TextStyle(color: Colors.white, fontFamily: 'Outfit', fontSize: 16),
            ),
          ],
        ),
        content: Text(
          _isSignUp 
              ? 'Could not register user. Please check your network connection or enter a valid email parameters.'
              : 'Incorrect credentials or user does not exist. Check your details or use standard demo mode.',
          style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Try Again', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _handleBypassDemo();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: const Color(0xFF0B1325),
            ),
            child: const Text('Skip to Demo', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _truecallerSubscription?.cancel();
    _animationController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _inviteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const bgColor = Color(0xFF0B1325);
    const primaryColor = Color(0xFF10B981);
    const cardColor = Color(0xFF070B16);
    const truecallerColor = Color(0xFF0087FF);

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        children: [
          // Background soft glowing blob
          Positioned(
            top: -150,
            right: -100,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: primaryColor.withOpacity(0.06),
                    blurRadius: 120,
                    spreadRadius: 80,
                  ),
                ],
              ),
            ),
          ),
          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Logo & branding header
                      const Hero(
                        tag: 'app_logo',
                        child: Icon(
                          Icons.auto_stories_rounded,
                          size: 64,
                          color: primaryColor,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'JTET साथी',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontFamily: 'Outfit',
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'सफलता का सारथी • JTET Exam Preparation',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.4),
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 36),

                      // 1. Truecaller First-Class Action Card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: cardColor,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: _truecallerAvailable 
                                ? truecallerColor.withOpacity(0.3) 
                                : Colors.white.withOpacity(0.04),
                            width: 1.5,
                          ),
                          boxShadow: [
                            if (_truecallerAvailable)
                              BoxShadow(
                                color: truecallerColor.withOpacity(0.08),
                                blurRadius: 30,
                                spreadRadius: 2,
                              ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.verified_user_rounded,
                                  color: _truecallerAvailable ? truecallerColor : Colors.white24,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '1-CLICK FAST LOGIN',
                                  style: TextStyle(
                                    color: _truecallerAvailable ? truecallerColor : Colors.white30,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Verify instantly with Truecaller profile for seamless, OTP-free exam portal access.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.5),
                                fontSize: 11,
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: _loading ? null : _verifyWithTruecaller,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: truecallerColor,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  elevation: 4,
                                  shadowColor: truecallerColor.withOpacity(0.3),
                                ),
                                child: _loading
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.phone_android_rounded, size: 20),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Verify via Truecaller App',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              fontFamily: 'Outfit',
                                            ),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // OR Divider
                      Row(
                        children: [
                          Expanded(child: Divider(color: Colors.white.withOpacity(0.08))),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'OR USE CREDENTIALS',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.25),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: Colors.white.withOpacity(0.08))),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // 2. Email Sign In / Sign Up Form Card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: cardColor,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.white.withOpacity(0.05)),
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (_isSignUp) ...[
                                _buildTextField(
                                  controller: _nameController,
                                  label: 'Full Name',
                                  icon: Icons.person_outline_rounded,
                                  validator: (val) {
                                    if (val == null || val.trim().isEmpty) return 'Enter your full name';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),
                              ],
                              
                              _buildTextField(
                                controller: _emailController,
                                label: 'Email Address',
                                icon: Icons.mail_outline_rounded,
                                keyboardType: TextInputType.emailAddress,
                                validator: (val) {
                                  if (val == null || val.trim().isEmpty || !val.contains('@')) {
                                    return 'Enter a valid email address';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                              
                              _buildTextField(
                                controller: _passwordController,
                                label: 'Password',
                                icon: Icons.lock_outline_rounded,
                                obscureText: _obscurePassword,
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                    color: Colors.white.withOpacity(0.3),
                                    size: 18,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                                validator: (val) {
                                  if (val == null || val.length < 6) {
                                    return 'Password must be at least 6 characters';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              if (_isSignUp) ...[
                                const Text(
                                  'Target Exam',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Inter',
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: bgColor,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: _selectedExam,
                                      dropdownColor: cardColor,
                                      icon: const Icon(Icons.arrow_drop_down, color: primaryColor),
                                      isExpanded: true,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      items: _exams.map((String exam) {
                                        return DropdownMenuItem<String>(
                                          value: exam.split(' (')[0],
                                          child: Text(exam),
                                        );
                                      }).toList(),
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() {
                                            _selectedExam = val;
                                          });
                                        }
                                      },
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),

                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Invite Code (Optional)',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'Inter',
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        _inviteController.text = 'JTETSATHI99';
                                      },
                                      child: const Text(
                                        'Use JTETSATHI99',
                                        style: TextStyle(
                                          color: primaryColor,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _inviteController,
                                  style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                                  decoration: InputDecoration(
                                    hintText: 'Enter code for 7 days Gold',
                                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 12),
                                    prefixIcon: Icon(Icons.stars_rounded, color: primaryColor.withOpacity(0.7), size: 18),
                                    filled: true,
                                    fillColor: bgColor,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],

                              SizedBox(
                                height: 50,
                                child: ElevatedButton(
                                  onPressed: _loading ? null : _handleAuthSubmit,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: primaryColor,
                                    foregroundColor: bgColor,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: _loading
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(color: bgColor, strokeWidth: 2),
                                        )
                                      : Text(
                                          _isSignUp ? 'Sign Up' : 'Sign In',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            fontFamily: 'Outfit',
                                          ),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Toggle Login/Signup modes
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _isSignUp ? 'Already have an account? ' : "Don't have an account? ",
                            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13),
                          ),
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _isSignUp = !_isSignUp;
                              });
                            },
                            child: Text(
                              _isSignUp ? 'Sign In' : 'Sign Up',
                              style: const TextStyle(
                                color: primaryColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                decoration: TextDecoration.underline,
                                decorationColor: primaryColor,
                                decorationThickness: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 36),

                      // Guest / Demo skip trigger
                      Center(
                        child: TextButton.icon(
                          onPressed: _loading ? null : _handleBypassDemo,
                          icon: const Icon(Icons.explore_outlined, size: 16, color: Colors.white38),
                          label: const Text(
                            'Explore as Guest (Offline Mode)',
                            style: TextStyle(
                              color: Colors.white38,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Outfit',
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 11,
            fontWeight: FontWeight.bold,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: const Color(0xFF10B981).withOpacity(0.6), size: 18),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: const Color(0xFF0B1325),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF10B981)),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Colors.redAccent),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}
