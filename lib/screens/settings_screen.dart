import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/cheat_provider.dart';
import '../widgets/glass_container.dart';
import '../screens/privacy_policy_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  void _showDisclaimer(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Disclaimer'),
        content: const Text(
          'This application is an unofficial cheat code reference app created for informational purposes only. It is not affiliated with or endorsed by any game developer or publisher.',
          style: TextStyle(height: 1.4),
        ),
        actions: [
          TextButton(
            child: const Text('OK'),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  void _showAbout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('CheatX - Game Cheat Codes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            SizedBox(height: 8),
            Text('Version: 1.0.0'),
            Text('Developer: Sunny Technology'),
            Text('Email: enterprisesunny201@gmail.com'),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('Close'),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  void _showPrivacyPolicy(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()),
    );
  }

  void _shareApp() {
    Share.share('Check out this premium Game Cheat Codes app! It works offline: https://cheatcodes.com');
  }

  void _rateApp(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Thank you for rating us 5 stars!'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<CheatProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Theme Settings Card
          const Text(
            'Appearance',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.palette_outlined),
                    SizedBox(width: 12),
                    Text('Dark Mode Theme', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ],
                ),
                DropdownButton<ThemeMode>(
                  value: provider.themeMode,
                  underline: const SizedBox(),
                  onChanged: (ThemeMode? newMode) {
                    if (newMode != null) {
                      provider.setThemeMode(newMode);
                    }
                  },
                  items: const [
                    DropdownMenuItem(
                      value: ThemeMode.light,
                      child: Text('Light'),
                    ),
                    DropdownMenuItem(
                      value: ThemeMode.dark,
                      child: Text('Dark'),
                    ),
                    DropdownMenuItem(
                      value: ThemeMode.system,
                      child: Text('Auto'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // App Information Card
          const Text(
            'Legal & Information',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          GlassContainer(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text('Disclaimer', style: TextStyle(fontWeight: FontWeight.w500)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showDisclaimer(context),
                ),
                Divider(height: 1, color: isDark ? Colors.white10 : Colors.black12),
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined),
                  title: const Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.w500)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showPrivacyPolicy(context),
                ),
                Divider(height: 1, color: isDark ? Colors.white10 : Colors.black12),
                ListTile(
                  leading: const Icon(Icons.help_outline),
                  title: const Text('About Developer', style: TextStyle(fontWeight: FontWeight.w500)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showAbout(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Actions Card
          const Text(
            'Support Us',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          GlassContainer(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.share_outlined),
                  title: const Text('Share App with Friends', style: TextStyle(fontWeight: FontWeight.w500)),
                  onTap: _shareApp,
                ),
                Divider(height: 1, color: isDark ? Colors.white10 : Colors.black12),
                ListTile(
                  leading: const Icon(Icons.star_outline),
                  title: const Text('Rate App', style: TextStyle(fontWeight: FontWeight.w500)),
                  onTap: () => _rateApp(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Persistent disclaimer text at bottom
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'This application is an unofficial cheat code reference app created for informational purposes only. It is not affiliated with or endorsed by any game developer or publisher.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: isDark ? Colors.white30 : Colors.black38),
            ),
          ),
        ],
      ),
    );
  }
}
