import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/app_state.dart';
import '../models/models.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  String _examSyllabus = 'JTET';
  String _languagePref = 'en';
  bool _saveSuccess = false;

  @override
  void initState() {
    super.initState();
    final state = Provider.of<AppState>(context, listen: false);
    _nameController = TextEditingController(text: state.profile?.fullName ?? '');
    _examSyllabus = state.profile?.preferredLanguage == 'hi' ? 'JTET' : 'JTET'; // default target
    _languagePref = state.profile?.preferredLanguage ?? 'en';
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _saveSettings() async {
    if (_formKey.currentState!.validate()) {
      final state = Provider.of<AppState>(context, listen: false);
      await state.updateProfileName(_nameController.text);
      await state.updateLanguage(_languagePref);
      
      setState(() {
        _saveSuccess = true;
      });

      Timer(const Duration(seconds: 3), () {
        if (mounted) {
          setState(() {
            _saveSuccess = false;
          });
        }
      });
    }
  }

  void _showRazorpayModal(AppState state, Color goldColor) {
    showDialog(
      context: context,
      builder: (context) {
        bool gatewayLoading = false;
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Dialog(
              backgroundColor: const Color(0xFF070B16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: Colors.indigo.withOpacity(0.3)),
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Razorpay stylized header
                  Container(
                    width: double.infinity,
                    color: Colors.indigo,
                    padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'RAZORPAY CHECKOUT',
                            style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'JTET Sathi Prep',
                          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Upgrade to JTET Sathi Premium',
                          style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11),
                        ),
                      ],
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Plan Price:', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                            const Text('₹199.00 INR', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('XP Welcome Bonus:', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                            const Text('+300 XP', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 24),

                        if (gatewayLoading)
                          const Column(
                            children: [
                              CircularProgressIndicator(color: Colors.indigo),
                              SizedBox(height: 12),
                              Text('Processing payment gateway simulator...', style: TextStyle(color: Colors.white54, fontSize: 10)),
                            ],
                          )
                        else
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () {
                                setModalState(() {
                                  gatewayLoading = true;
                                });
                                Timer(const Duration(seconds: 2), () async {
                                  await state.upgradeToPremium();
                                  if (context.mounted) {
                                    Navigator.pop(context);
                                    _showSuccessUpgradeDialog();
                                  }
                                });
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.indigo,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('Simulate Successful Upgrade', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                      ],
                    ),
                  )
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showSuccessUpgradeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF070B16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
        ),
        title: const Row(
          children: [
            Icon(Icons.stars, color: Color(0xFF10B981)),
            SizedBox(width: 8),
            Text('Upgrade Complete!', style: TextStyle(color: Colors.white, fontFamily: 'Outfit')),
          ],
        ),
        content: const Text(
          'Premium benefits active! You have been awarded 300 XP and unlimited access to JTET Sathi mock tests.',
          style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: const Color(0xFF0B1325)),
            child: const Text('Launch Course', style: TextStyle(fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }

  void _simulateLocalNotification() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: const Row(
          children: [
            Icon(Icons.local_fire_department, color: Color(0xFF0B1325)),
            SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Streak Alert! 🔥',
                    style: TextStyle(color: Color(0xFF0B1325), fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                  Text(
                    'Maintain your progress. Complete today\'s JTET daily MCQ challenge to protect your streak.',
                    style: TextStyle(color: Color(0xFF0B1325), fontSize: 10),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSignOut(AppState state) async {
    // Show confirmation dialog first
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF070B16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        title: const Text('Sign Out', style: TextStyle(color: Colors.white, fontFamily: 'Outfit')),
        content: const Text('Are you sure you want to sign out from JTET Sathi?', style: TextStyle(color: Colors.white70, fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            child: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await state.signOut();
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  void _shareApp(String inviteCode) {
    final text = 'Hey! Prepare for JTET with me on JTET Sathi. Use my code "$inviteCode" to unlock 7 days of Premium Gold mock series for free! Download the app now.';
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: const Row(
          children: [
            Icon(Icons.check_circle_outline, color: Color(0xFF0B1325)),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Share text with referral code copied to clipboard!',
                style: TextStyle(color: Color(0xFF0B1325), fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final profile = state.profile;
    final goldColor = const Color(0xFF10B981);

    // Calculate aggregated metrics
    final totalSolved = state.attempts.fold<int>(0, (sum, item) => sum + item.totalQuestions);
    final correctAnswers = state.attempts.fold<int>(0, (sum, item) => sum + item.correctAnswers);
    final averageAccuracy = totalSolved > 0 ? ((correctAnswers / totalSolved) * 100).toInt() : 0;

    // Badge configuration
    final hasCrown = (profile?.totalPoints ?? 0) >= 1000;
    final hasFlame = (profile?.streak ?? 0) >= 5;
    final hasTarget = averageAccuracy >= 75 && totalSolved >= 5;

    final inviteCode = 'JTETSATHI99';

    return Scaffold(
      backgroundColor: const Color(0xFF0B1325),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Text(
                'Aspirant Portfolio',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Outfit',
                ),
              ),
              const SizedBox(height: 16),

              // 1. Profile Bio Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.06)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: goldColor.withOpacity(0.12),
                      child: Text(
                        (profile?.fullName ?? 'U').substring(0, 1).toUpperCase(),
                        style: TextStyle(color: goldColor, fontSize: 26, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profile?.fullName ?? 'Aspirant',
                            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            profile?.email ?? 'aspirant@jtetsathi.in',
                            style: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 10, fontFamily: 'Inter'),
                          ),
                          const SizedBox(height: 8),
                          profile?.isPremium == true
                              ? Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: goldColor.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: goldColor.withOpacity(0.25)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.stars, color: goldColor, size: 12),
                                      const SizedBox(width: 4),
                                      Text(
                                        'GOLD PREMIUM',
                                        style: TextStyle(color: goldColor, fontSize: 8, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                )
                              : Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.05),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                                  ),
                                  child: Text(
                                    'FREE ACCOUNT',
                                    style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 8, fontWeight: FontWeight.bold),
                                  ),
                                ),
                        ],
                      ),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 2. Academic Metrics Grid
              const Text('Academic Metrics', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Outfit')),
              const SizedBox(height: 10),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                childAspectRatio: 1.6,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                children: [
                  _buildMetricTile('Accuracy', '$averageAccuracy%', Colors.greenAccent),
                  _buildMetricTile('Solved Questions', '$totalSolved', Colors.white70),
                  _buildMetricTile('Academy XP', '${profile?.totalPoints ?? 0}', goldColor),
                  _buildMetricTile('Study Streak', '${profile?.streak ?? 0} days', Colors.orangeAccent),
                ],
              ),
              const SizedBox(height: 20),

              // 3. Subscription Upgraders Promo
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF0F172A),
                      Colors.indigo.withOpacity(0.12),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.indigo.withOpacity(0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'JTET Sathi Premium',
                            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Unlock all standard references, GPT doubt solvers & customize quizzes.',
                            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    profile?.isPremium == true
                        ? Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.green.withOpacity(0.3)),
                            ),
                            child: const Text('ACTIVE GOLD', style: TextStyle(color: Colors.greenAccent, fontSize: 9, fontWeight: FontWeight.bold)),
                          )
                        : ElevatedButton(
                            onPressed: () => _showRazorpayModal(state, goldColor),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.indigo,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('Buy Gold'),
                          ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 4. Invite & Referral code & Share Controls
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.01),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Referral Invite Code', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 2),
                    Text('Share code with peers. Both get 7 days of Premium Gold.', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF070B16),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withOpacity(0.05)),
                            ),
                            child: Text(
                              inviteCode,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 1.5, fontFamily: 'monospace'),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: inviteCode));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Referral code copied to clipboard!')),
                            );
                          },
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.white.withOpacity(0.05),
                            padding: const EdgeInsets.all(12),
                          ),
                          icon: const Icon(Icons.copy, color: Colors.white70, size: 18),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () => _shareApp(inviteCode),
                          style: IconButton.styleFrom(
                            backgroundColor: goldColor.withOpacity(0.1),
                            padding: const EdgeInsets.all(12),
                          ),
                          icon: Icon(Icons.share, color: goldColor, size: 18),
                        )
                      ],
                    )
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 5. Achievement Badges
              const Text('Achievement Badges', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Outfit')),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildBadgeCard('JTET Achiever', 'Score >1000 XP', Icons.workspace_premium, hasCrown, goldColor),
                  _buildBadgeCard('Consistency', 'Streak >5 days', Icons.local_fire_department, hasFlame, Colors.orangeAccent),
                  _buildBadgeCard('Accuracy Master', 'MCQ Acc >75%', Icons.track_changes, hasTarget, Colors.blueAccent),
                ],
              ),
              const SizedBox(height: 24),

              // 6. Settings Form Panel
              const Text('Academic Settings', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Outfit')),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.01),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_saveSuccess)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(8),
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(color: Colors.green.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                          child: const Text('Settings saved successfully.', style: TextStyle(color: Colors.greenAccent, fontSize: 11)),
                        ),

                      // Name Input
                      const Text('Aspirant Name', style: TextStyle(color: Colors.white30, fontSize: 9, fontWeight: FontWeight.bold)),
                      TextFormField(
                        controller: _nameController,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Please enter name';
                          return null;
                        },
                        decoration: InputDecoration(
                          hintText: 'Enter full name',
                          hintStyle: TextStyle(color: Colors.white.withOpacity(0.2)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                      ),
                      const Divider(color: Colors.white10),
                      const SizedBox(height: 12),

                      // Syllabus Selection Dropdown
                      const Text('Target Exam', style: TextStyle(color: Colors.white30, fontSize: 9, fontWeight: FontWeight.bold)),
                      DropdownButton<String>(
                        value: _examSyllabus,
                        dropdownColor: const Color(0xFF070B16),
                        underline: Container(),
                        isExpanded: true,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        icon: Icon(Icons.arrow_drop_down, color: Colors.white.withOpacity(0.4)),
                        onChanged: (String? val) {
                          if (val != null) {
                            setState(() {
                              _examSyllabus = val;
                            });
                          }
                        },
                        items: ['JTET', 'SSC CGL'].map((item) {
                          return DropdownMenuItem<String>(
                            value: item,
                            child: Text(item == 'JTET' ? 'JTET (Jharkhand Teacher)' : 'SSC CGL General'),
                          );
                        }).toList(),
                      ),
                      const Divider(color: Colors.white10),
                      const SizedBox(height: 12),

                      // Language Dropdown
                      const Text('Language preference', style: TextStyle(color: Colors.white30, fontSize: 9, fontWeight: FontWeight.bold)),
                      DropdownButton<String>(
                        value: _languagePref,
                        dropdownColor: const Color(0xFF070B16),
                        underline: Container(),
                        isExpanded: true,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        icon: Icon(Icons.arrow_drop_down, color: Colors.white.withOpacity(0.4)),
                        onChanged: (String? val) {
                          if (val != null) {
                            setState(() {
                              _languagePref = val;
                            });
                          }
                        },
                        items: const [
                          DropdownMenuItem<String>(value: 'en', child: Text('English (Target)')),
                          DropdownMenuItem<String>(value: 'hi', child: Text('Bilingual (Hindi / English)')),
                        ],
                      ),
                      const Divider(color: Colors.white10),
                      const SizedBox(height: 16),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _saveSettings,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: goldColor,
                            foregroundColor: const Color(0xFF0B1325),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Save Settings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // 7. Push alerts testing
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.01),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Push Alerts Tester', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Fire streak notifications to check push mechanics.', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10)),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _simulateLocalNotification,
                        icon: const Icon(Icons.add_alert_rounded, size: 14, color: Color(0xFF0B1325)),
                        label: const Text('Send Test Push Reminder'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: goldColor,
                          foregroundColor: const Color(0xFF0B1325),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 8. Sign Out Control (Beautiful red outlined block)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _handleSignOut(state),
                  icon: const Icon(Icons.logout_rounded, size: 16, color: Colors.redAccent),
                  label: const Text(
                    'Sign Out Account',
                    style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: BorderSide(color: Colors.redAccent.withOpacity(0.35)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricTile(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.01),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 9),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeCard(String title, String desc, IconData icon, bool isUnlocked, Color activeColor) {
    return Expanded(
      child: Container(
        height: 100,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isUnlocked ? activeColor.withOpacity(0.04) : Colors.white.withOpacity(0.01),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isUnlocked ? activeColor.withOpacity(0.2) : Colors.white.withOpacity(0.04)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isUnlocked ? activeColor : Colors.white.withOpacity(0.2),
              size: 28,
            ),
            const SizedBox(height: 6),
            Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: isUnlocked ? Colors.white : Colors.white.withOpacity(0.3),
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white.withOpacity(0.3),
                fontSize: 8,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
