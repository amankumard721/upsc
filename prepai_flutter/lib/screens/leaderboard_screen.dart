import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/models.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  String _activeTab = 'Weekly';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  List<UserProfile> _leaderboard = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
    });
    final state = Provider.of<AppState>(context, listen: false);
    final list = await state.db.getLeaderboard();
    setState(() {
      _leaderboard = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext StateContext) {
    final state = Provider.of<AppState>(StateContext);
    
    // Filter leaderboard list
    final filteredList = _leaderboard.where((user) {
      return user.fullName.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    // Split top 3 vs others
    final podium = filteredList.take(3).toList();
    final regularList = filteredList.length > 3 ? filteredList.sublist(3) : <UserProfile>[];

    return Scaffold(
      backgroundColor: const Color(0xFF0B1325),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Header Info & Search
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.emoji_events_rounded, color: Color(0xFF10B981), size: 24),
                      const SizedBox(width: 8),
                      const Text(
                        'Academy Rankings',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Outfit',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Search Bar
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF070B16),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.08)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Search aspirants...',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 13),
                        prefixIcon: Icon(Icons.search, color: Colors.white.withOpacity(0.3), size: 18),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 2. Tabs
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Row(
                children: ['Weekly', 'Monthly', 'All-Time'].map((tab) {
                  final isSelected = _activeTab == tab;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _activeTab = tab;
                        });
                        _loadData(); // Re-trigger load to simulate sync
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF10B981) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            tab,
                            style: TextStyle(
                              color: isSelected ? const Color(0xFF0B1325) : Colors.white.withOpacity(0.6),
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // 3. Body Scroll
            Expanded(
              child: _loading 
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                  : RefreshIndicator(
                      onRefresh: _loadData,
                      color: const Color(0xFF10B981),
                      backgroundColor: const Color(0xFF070B16),
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Column(
                          children: [
                            // 3D Podium Layout
                            if (podium.isNotEmpty && _searchQuery.isEmpty)
                              _buildPodium(podium, state),
                            
                            const SizedBox(height: 16),
                            
                            // Rankings list
                            filteredList.isEmpty
                                ? const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 40.0),
                                    child: Text(
                                      'No matches found.',
                                      style: TextStyle(color: Colors.white24, fontSize: 13),
                                    ),
                                  )
                                : Container(
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.01),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.white.withOpacity(0.06)),
                                    ),
                                    clipBehavior: Clip.antiAlias,
                                    child: ListView.separated(
                                      shrinkWrap: true,
                                      physics: const NeverScrollableScrollPhysics(),
                                      itemCount: _searchQuery.isNotEmpty 
                                          ? filteredList.length 
                                          : regularList.length,
                                      separatorBuilder: (_, __) => Divider(color: Colors.white.withOpacity(0.04), height: 1),
                                      itemBuilder: (context, index) {
                                        final user = _searchQuery.isNotEmpty 
                                            ? filteredList[index] 
                                            : regularList[index];
                                        final globalRank = _searchQuery.isNotEmpty 
                                            ? index + 1 
                                            : index + 4;
                                        return _buildUserListTile(user, globalRank, state);
                                      },
                                    ),
                                  ),
                            const SizedBox(height: 32),
                          ],
                        ),
                      ),
                    ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildPodium(List<UserProfile> podium, AppState state) {
    final goldColor = const Color(0xFF10B981);
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Rank 2
          if (podium.length > 1)
            Expanded(
              child: _buildPodiumItem(
                user: podium[1],
                rank: 2,
                color: const Color(0xFFB0BEC5), // Silver
                cardHeight: 80,
                icon: Icons.workspace_premium,
              ),
            ),
          
          // Rank 1
          if (podium.isNotEmpty)
            Expanded(
              child: _buildPodiumItem(
                user: podium[0],
                rank: 1,
                color: goldColor,
                cardHeight: 110,
                icon: Icons.military_tech,
                hasCrown: true,
              ),
            ),

          // Rank 3
          if (podium.length > 2)
            Expanded(
              child: _buildPodiumItem(
                user: podium[2],
                rank: 3,
                color: const Color(0xFF8D6E63), // Bronze
                cardHeight: 65,
                icon: Icons.workspace_premium,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPodiumItem({
    required UserProfile user,
    required int rank,
    required Color color,
    required double cardHeight,
    required IconData icon,
    bool hasCrown = false,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (hasCrown)
          const Icon(Icons.stars, color: Color(0xFF10B981), size: 20)
        else
          const SizedBox(height: 20),
        const SizedBox(height: 4),
        
        // Avatar circle
        Stack(
          alignment: Alignment.bottomCenter,
          clipBehavior: Clip.none,
          children: [
            CircleAvatar(
              radius: rank == 1 ? 32 : 26,
              backgroundColor: color.withOpacity(0.4),
              child: CircleAvatar(
                radius: rank == 1 ? 29 : 24,
                backgroundColor: const Color(0xFF070B16),
                child: Text(
                  user.fullName.substring(0, 1),
                  style: TextStyle(
                    color: color,
                    fontSize: rank == 1 ? 20 : 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -6,
              child: CircleAvatar(
                radius: 9,
                backgroundColor: color,
                child: Text(
                  '$rank',
                  style: const TextStyle(
                    color: Color(0xFF0B1325),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            )
          ],
        ),
        const SizedBox(height: 12),
        
        // Name and score
        Text(
          user.fullName.split(' ')[0],
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.bolt, color: Color(0xFF10B981), size: 12),
            Text(
              '${user.totalPoints}',
              style: const TextStyle(
                color: Color(0xFF10B981),
                fontSize: 11,
                fontWeight: FontWeight.bold,
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        
        // Solid podium block
        Container(
          height: cardHeight,
          margin: const EdgeInsets.symmetric(horizontal: 6),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                color.withOpacity(0.2),
                color.withOpacity(0.05),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(12),
              topRight: Radius.circular(12),
            ),
            border: Border.all(color: color.withOpacity(0.2), width: 1),
          ),
          child: Center(
            child: Icon(icon, color: color.withOpacity(0.4), size: 24),
          ),
        )
      ],
    );
  }

  Widget _buildUserListTile(UserProfile user, int rank, AppState state) {
    final isSelf = user.id == state.userId;
    
    return Container(
      color: isSelf ? const Color(0xFF10B981).withOpacity(0.05) : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          // Rank Index
          SizedBox(
            width: 24,
            child: Text(
              '$rank',
              style: TextStyle(
                color: isSelf ? const Color(0xFF10B981) : Colors.white.withOpacity(0.3),
                fontWeight: FontWeight.bold,
                fontSize: 12,
                fontFamily: 'Inter',
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Avatar
          CircleAvatar(
            radius: 16,
            backgroundColor: Colors.white.withOpacity(0.05),
            child: Text(
              user.fullName.substring(0, 1),
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 12),

          // Name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      user.fullName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (isSelf) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                        ),
                        child: const Text(
                          'YOU',
                          style: TextStyle(color: Color(0xFF10B981), fontSize: 7, fontWeight: FontWeight.bold),
                        ),
                      )
                    ]
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'Streak: ${user.streak} days',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.3),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),

          // Streak icon indicator
          Row(
            children: [
              const Icon(Icons.local_fire_department, color: Colors.orange, size: 14),
              const SizedBox(width: 2),
              Text(
                '${user.streak}d',
                style: const TextStyle(color: Colors.orange, fontSize: 11, fontFamily: 'Inter'),
              ),
            ],
          ),
          const SizedBox(width: 16),

          // Score points
          Row(
            children: [
              const Icon(Icons.bolt, color: Color(0xFF10B981), size: 14),
              Text(
                '${user.totalPoints}',
                style: const TextStyle(
                  color: Color(0xFF10B981),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
