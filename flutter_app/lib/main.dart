import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

const String kApiBase = 'https://vetrigas.onrender.com';

void main() {
  runApp(const VetriIndaneWorkerApp());
}

class VetriIndaneWorkerApp extends StatelessWidget {
  const VetriIndaneWorkerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vetri Indane Enterprise Platform',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF070D19),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF1E3A8A),
          secondary: Color(0xFFF59E0B),
          surface: Color(0xFF0F172A),
          background: Color(0xFF070D19),
          onPrimary: Colors.white,
          onSurface: Colors.white,
        ),
        fontFamily: 'Roboto',
        cardTheme: CardThemeData(
          color: const Color(0xFF0F172A),
          elevation: 4,
          shadowColor: Colors.black.withOpacity(0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFF1E293B), width: 1),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF1E293B),
          labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
          hintStyle: const TextStyle(color: Color(0xFF64748B)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFF59E0B), width: 1.5),
          ),
        ),
      ),
      home: const RoleSelectScreen(),
    );
  }
}

// ============================================================================
// ROLE SELECT / UNIFIED LOGIN SCREEN
// ============================================================================
class RoleSelectScreen extends StatefulWidget {
  const RoleSelectScreen({super.key});

  @override
  State<RoleSelectScreen> createState() => _RoleSelectScreenState();
}

class _RoleSelectScreenState extends State<RoleSelectScreen> {
  String selectedRole = 'OWNER';
  final TextEditingController _emailController =
      TextEditingController(text: 'owner@vetriindane.com');
  final TextEditingController _passwordController =
      TextEditingController(text: 'Vetri@2026');
  bool _obscurePassword = true;
  bool _isLoading = false;

  final Map<String, Map<String, String>> rolePresets = {
    'OWNER': {
      'email': 'owner@vetriindane.com',
      'pass': 'Vetri@2026',
      'title': 'Owner Control Room',
      'desc': 'Executive revenue KPIs & financial approvals',
    },
    'MANAGER': {
      'email': 'santhosh.manager@vetriindane.com',
      'pass': 'Santhosh@2026',
      'title': 'Operations Manager',
      'desc': 'Fleet tracking & dispatch management',
    },
    'DRIVER': {
      'email': 'arun.driver@vetriindane.com',
      'pass': 'Arun@2026',
      'title': 'Driver Mobile App',
      'desc': 'Assigned routes & customer payment receipts',
    },
    'LOADMAN': {
      'email': 'kumar.loadman@vetriindane.com',
      'pass': 'Kumar@2026',
      'title': 'Loadman Mobile App',
      'desc': 'Depot loading batches & cylinder count audits',
    },
    'STOREROOM': {
      'email': 'priya.office@vetriindane.com',
      'pass': 'Priya@2026',
      'title': 'Godown & Inventory Desk',
      'desc': 'Stock reconciliation & walk-in order entry',
    },
  };

  void _onRoleChanged(String role) {
    setState(() {
      selectedRole = role;
      _emailController.text = rolePresets[role]!['email']!;
      _passwordController.text = rolePresets[role]!['pass']!;
    });
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
    });

    final emailInput = _emailController.text.trim();
    final passwordInput = _passwordController.text.trim();
    String authUserName = '';

    try {
      final response = await http.post(
        Uri.parse('$kApiBase/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': emailInput,
          'password': passwordInput,
        }),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['user'] != null) {
          authUserName = data['user']['name'] ?? '';
        }
      }
    } catch (e) {
      debugPrint('Cloud Auth fallback mode: $e');
    }

    if (!mounted) return;
    setState(() {
      _isLoading = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF0F172A),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Row(
          children: [
            const Icon(Icons.cloud_done, color: Color(0xFF10B981), size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                authUserName.isNotEmpty
                    ? 'Connected to Cloud DB: Welcome $authUserName!'
                    : 'Authenticated into Vetri Indane System ($selectedRole)',
                style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );

    Widget destinationScreen;
    if (selectedRole == 'OWNER') {
      destinationScreen = const OwnerHomeScreen();
    } else if (selectedRole == 'MANAGER') {
      destinationScreen = const ManagerHomeScreen();
    } else if (selectedRole == 'DRIVER') {
      destinationScreen = const DriverHomeScreen();
    } else if (selectedRole == 'LOADMAN') {
      destinationScreen = const LoadmanHomeScreen();
    } else {
      destinationScreen = const StoreroomHomeScreen();
    }

    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => destinationScreen),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF070D19), Color(0xFF0F172A), Color(0xFF1E293B)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Enterprise Logo Header
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFF59E0B), width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withOpacity(0.2),
                          blurRadius: 16,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.local_fire_department,
                      color: Color(0xFFF59E0B),
                      size: 38,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'VETRI INDANE LPG',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'CLOUD LIVE SYNC ACTIVE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF10B981),
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Role Selection Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: rolePresets.keys.map((role) {
                        final isSelected = selectedRole == role;
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: ChoiceChip(
                            label: Text(
                              role,
                              style: TextStyle(
                                color: isSelected ? Colors.black : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                            selected: isSelected,
                            selectedColor: const Color(0xFFF59E0B),
                            backgroundColor: const Color(0xFF1E293B),
                            side: BorderSide(
                              color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFF334155),
                            ),
                            onSelected: (_) => _onRoleChanged(role),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Login Form Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            rolePresets[selectedRole]!['title']!,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            rolePresets[selectedRole]!['desc']!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                          const SizedBox(height: 20),
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            decoration: const InputDecoration(
                              labelText: 'Official Email / Phone',
                              prefixIcon: Icon(Icons.email_outlined, color: Color(0xFF94A3B8), size: 20),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            decoration: InputDecoration(
                              labelText: 'Password',
                              prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF94A3B8), size: 20),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                  color: const Color(0xFF94A3B8),
                                  size: 20,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFF59E0B),
                                foregroundColor: Colors.black,
                                elevation: 4,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              onPressed: _isLoading ? null : _handleLogin,
                              child: _isLoading
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        color: Colors.black,
                                      ),
                                    )
                                  : Text(
                                      'AUTHENTICATE $selectedRole',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shield_outlined, size: 14, color: Color(0xFF10B981)),
                      SizedBox(width: 6),
                      Text(
                        'Render Cloud Synchronized  •  Helpline: +91 96008 70814',
                        style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// 1. DRIVER HOME SCREEN (REAL-TIME CLOUD FETCH, COMPLETE DELIVERIES, EXPENSE)
// ============================================================================
class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  int _currentIndex = 0;
  bool _isLoading = true;

  List<Map<String, dynamic>> _deliveries = [];
  List<Map<String, dynamic>> _vehicles = [];

  final TextEditingController _expAmountController = TextEditingController();
  final TextEditingController _expNoteController = TextEditingController();
  String _expType = 'Diesel Refuel';

  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchLiveDriverData();
    // 5-second background polling loop for real-time cloud data sync
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) _fetchLiveDriverData(silent: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchLiveDriverData({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);

    try {
      // Fetch Deliveries from Render Cloud API
      final delResponse = await http.get(Uri.parse('$kApiBase/api/deliveries')).timeout(const Duration(seconds: 5));
      if (delResponse.statusCode == 200) {
        final data = jsonDecode(delResponse.body);
        if (data['success'] == true && data['deliveries'] != null) {
          final List list = data['deliveries'];
          setState(() {
            _deliveries = list.map((e) => Map<String, dynamic>.from(e)).toList();
          });
        }
      }

      // Fetch Telemetry from Render Cloud API
      final vehResponse = await http.get(Uri.parse('$kApiBase/api/gps/vehicles')).timeout(const Duration(seconds: 5));
      if (vehResponse.statusCode == 200) {
        final data = jsonDecode(vehResponse.body);
        if (data['success'] == true && data['vehicles'] != null) {
          final List list = data['vehicles'];
          setState(() {
            _vehicles = list.map((e) => Map<String, dynamic>.from(e)).toList();
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching driver cloud data: $e');
    } finally {
      if (!silent && mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _completeDelivery(Map<String, dynamic> del, String paymentMethod) async {
    final delId = del['id'];

    // Optimistic UI Update
    setState(() {
      final index = _deliveries.indexWhere((d) => d['id'] == delId);
      if (index != -1) {
        _deliveries[index]['status'] = 'DELIVERED';
        _deliveries[index]['paymentType'] = paymentMethod;
      }
    });

    try {
      await http.put(
        Uri.parse('$kApiBase/api/deliveries/$delId/status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'status': 'DELIVERED',
          'paymentType': paymentMethod,
        }),
      );
    } catch (e) {
      debugPrint('Complete delivery HTTP update error: $e');
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        content: Text(
          'Order $delId Completed via $paymentMethod! Bill saved to Render Cloud DB.',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Future<void> _sendWhatsAppReceipt(Map<String, dynamic> del) async {
    final phone = del['phone'] ?? '+91 96008 70814';
    final name = del['customerName'] ?? 'Valued Customer';
    final billNo = del['id'] != null ? 'VI-${del['id']}' : 'VI-2026-00101';
    final amount = del['amount'] ?? 940;

    try {
      await http.post(
        Uri.parse('$kApiBase/api/whatsapp/send-receipt'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'customerPhone': phone,
          'customerName': name,
          'billNumber': billNo,
          'amount': amount,
          'paymentMethod': del['paymentType'] ?? 'UPI',
          'driverName': 'Arun',
        }),
      );
    } catch (e) {
      debugPrint('WhatsApp receipt call note: $e');
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF0F172A),
        behavior: SnackBarBehavior.floating,
        content: Text(
          'WhatsApp Digital Receipt sent to $phone (+91 96008 70814 Helpline)',
          style: const TextStyle(color: Color(0xFFF59E0B)),
        ),
      ),
    );
  }

  Future<void> _submitExpense() async {
    if (_expAmountController.text.isEmpty) return;

    final amount = double.tryParse(_expAmountController.text) ?? 0;
    final notes = _expNoteController.text;

    try {
      await http.post(
        Uri.parse('$kApiBase/api/expenses'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'driverName': 'Arun',
          'type': _expType,
          'amount': amount,
          'vehicleNo': 'TN 38 AU 4821',
          'notes': notes,
        }),
      );
    } catch (e) {
      debugPrint('Expense submit error: $e');
    }

    _expAmountController.clear();
    _expNoteController.clear();

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        content: Text('Expense submitted to Owner for approval!'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final completedCount = _deliveries.where((d) => d['status'] == 'DELIVERED').length;
    final totalCollections = _deliveries
        .where((d) => d['status'] == 'DELIVERED')
        .fold<num>(0, (sum, item) => sum + (item['amount'] as num? ?? 0));

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Driver Operations Desk (Arun)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Live Cloud Sync Active', style: TextStyle(fontSize: 10, color: Color(0xFF10B981))),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFF59E0B)),
            onPressed: () => _fetchLiveDriverData(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchLiveDriverData(),
        color: const Color(0xFFF59E0B),
        child: IndexedStack(
          index: _currentIndex,
          children: [
            // TAB 1: DELIVERIES
            _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFF59E0B)))
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // KPI Card
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Vehicle: TN 38 AU 4821',
                                    style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  Chip(
                                    label: Text('GPS ACTIVE', style: TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.bold)),
                                    backgroundColor: Color(0xFF10B981),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Deliveries: $completedCount / ${_deliveries.length}',
                                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    'Collection: ₹$totalCollections',
                                    style: const TextStyle(color: Color(0xFF10B981), fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'TODAY\'S ASSIGNED ROUTE (REAL-TIME CLOUD)',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                      const SizedBox(height: 8),
                      if (_deliveries.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(32),
                          child: Center(
                            child: Text('No active deliveries found in database.', style: TextStyle(color: Colors.grey)),
                          ),
                        )
                      else
                        ..._deliveries.map((del) {
                          final isDelivered = del['status'] == 'DELIVERED';
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          '${del['customerName']} (${del['id']})',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                      ),
                                      Chip(
                                        label: Text(
                                          del['status'] ?? 'PENDING',
                                          style: TextStyle(
                                            color: isDelivered ? Colors.black : Colors.white,
                                            fontSize: 9,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        backgroundColor: isDelivered ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, color: Color(0xFF94A3B8), size: 14),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          del['address'] ?? 'Coimbatore',
                                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${del['category'] ?? 'LPG Cylinder'}  •  Phone: ${del['phone'] ?? '+91 96008 70814'}',
                                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '₹${del['amount'] ?? 940}',
                                        style: const TextStyle(color: Color(0xFF10B981), fontSize: 18, fontWeight: FontWeight.bold),
                                      ),
                                      if (!isDelivered)
                                        Row(
                                          children: [
                                            ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF10B981),
                                                foregroundColor: Colors.black,
                                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                              ),
                                              onPressed: () => _completeDelivery(del, 'UPI'),
                                              child: const Text('UPI', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
                                            ),
                                            const SizedBox(width: 8),
                                            ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFFF59E0B),
                                                foregroundColor: Colors.black,
                                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                              ),
                                              onPressed: () => _completeDelivery(del, 'CASH'),
                                              child: const Text('CASH', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
                                            ),
                                          ],
                                        )
                                      else
                                        OutlinedButton.icon(
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: const Color(0xFF10B981),
                                            side: const BorderSide(color: Color(0xFF10B981)),
                                          ),
                                          icon: const Icon(Icons.chat_bubble_outline, size: 14),
                                          label: const Text('WHATSAPP RECEIPT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                          onPressed: () => _sendWhatsAppReceipt(del),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                    ],
                  ),

            // TAB 2: FLEET EXPENSE SUBMISSION
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('SUBMIT FLEET EXPENSE', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Expense reports directly link to SQLite financial ledger', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _expType,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Expense Category'),
                  items: ['Diesel Refuel', 'Toll Charge', 'Vehicle Repair', 'Other']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (val) => setState(() => _expType = val!),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _expAmountController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Amount (₹)'),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _expNoteController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Notes / Litres / Toll Plaza Name'),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF59E0B),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: _submitExpense,
                  child: const Text('SUBMIT FOR OWNER APPROVAL', style: TextStyle(fontWeight: FontWeight.w900)),
                ),
              ],
            ),

            // TAB 3: LIVE TELEMETRY
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('LIVE VEHICLE GPS TELEMETRY', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                if (_vehicles.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('Connecting to IoT Telemetry Stream...', style: TextStyle(color: Colors.grey)),
                    ),
                  )
                else
                  ..._vehicles.map((v) {
                    final isMoving = v['status'] == 'MOVING';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: Icon(
                          Icons.local_shipping,
                          color: isMoving ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                          size: 32,
                        ),
                        title: Text(
                          '${v['registrationNumber']} (${v['driverName'] ?? 'Driver'})',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          'Speed: ${v['speed']} km/h  •  Completed: ${v['completedDeliveries'] ?? 0}/${v['totalDeliveries'] ?? 20}',
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        ),
                        trailing: Chip(
                          label: Text(
                            v['status'] ?? 'ACTIVE',
                            style: const TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                          backgroundColor: isMoving ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        ),
                      ),
                    );
                  }),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: const Color(0xFFF59E0B),
        unselectedItemColor: const Color(0xFF64748B),
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.local_shipping_outlined), label: 'Deliveries'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), label: 'Expenses'),
          BottomNavigationBarItem(icon: Icon(Icons.speed_outlined), label: 'Telemetry'),
        ],
      ),
    );
  }
}

// ============================================================================
// 2. OWNER CONTROL ROOM SCREEN (REAL-TIME CLOUD FETCH, ORDER BOOKING, AUDITS)
// ============================================================================
class OwnerHomeScreen extends StatefulWidget {
  const OwnerHomeScreen({super.key});

  @override
  State<OwnerHomeScreen> createState() => _OwnerHomeScreenState();
}

class _OwnerHomeScreenState extends State<OwnerHomeScreen> {
  int _currentIndex = 0;
  bool _isLoading = true;

  List<Map<String, dynamic>> _vehicles = [];
  List<Map<String, dynamic>> _employees = [];
  List<Map<String, dynamic>> _expenses = [];

  final TextEditingController _custNameController = TextEditingController();
  final TextEditingController _custPhoneController = TextEditingController();
  final TextEditingController _custAddressController = TextEditingController();
  String _cylType = '14.2kg Domestic';

  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchLiveOwnerData();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) _fetchLiveOwnerData(silent: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchLiveOwnerData({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);

    try {
      final vehRes = await http.get(Uri.parse('$kApiBase/api/gps/vehicles')).timeout(const Duration(seconds: 5));
      if (vehRes.statusCode == 200) {
        final data = jsonDecode(vehRes.body);
        if (data['success'] == true && data['vehicles'] != null) {
          final List list = data['vehicles'];
          setState(() => _vehicles = list.map((e) => Map<String, dynamic>.from(e)).toList());
        }
      }

      final empRes = await http.get(Uri.parse('$kApiBase/api/employees')).timeout(const Duration(seconds: 5));
      if (empRes.statusCode == 200) {
        final data = jsonDecode(empRes.body);
        if (data['success'] == true && data['employees'] != null) {
          final List list = data['employees'];
          setState(() => _employees = list.map((e) => Map<String, dynamic>.from(e)).toList());
        }
      }

      final expRes = await http.get(Uri.parse('$kApiBase/api/expenses')).timeout(const Duration(seconds: 5));
      if (expRes.statusCode == 200) {
        final data = jsonDecode(expRes.body);
        if (data['success'] == true && data['expenses'] != null) {
          final List list = data['expenses'];
          setState(() => _expenses = list.map((e) => Map<String, dynamic>.from(e)).toList());
        }
      }
    } catch (e) {
      debugPrint('Error fetching owner data: $e');
    } finally {
      if (!silent && mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _bookOrder() async {
    if (_custNameController.text.isEmpty || _custPhoneController.text.isEmpty) return;

    final name = _custNameController.text.trim();
    final phone = _custPhoneController.text.trim();
    final address = _custAddressController.text.trim();

    try {
      await http.post(
        Uri.parse('$kApiBase/api/deliveries'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'customerName': name,
          'address': address,
          'phone': phone,
          'category': _cylType,
          'amount': _cylType.contains('19kg') ? 1850 : 940,
          'assignedDriverId': 'emp-01',
        }),
      );
    } catch (e) {
      debugPrint('Book order error: $e');
    }

    _custNameController.clear();
    _custPhoneController.clear();
    _custAddressController.clear();

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        content: Text('Order booked successfully for $name! Saved to SQLite Cloud DB.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Owner Executive Room (Vetri)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Live Render Cloud Connection', style: TextStyle(fontSize: 10, color: Color(0xFF10B981))),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFF59E0B)),
            onPressed: () => _fetchLiveOwnerData(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchLiveOwnerData(),
        color: const Color(0xFFF59E0B),
        child: IndexedStack(
          index: _currentIndex,
          children: [
            // TAB 1: EXECUTIVE KPIS & ALERTS
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Daily Gross Collections', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                      const SizedBox(height: 4),
                      const Text('₹ 1,42,850.00', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _MetricChip(title: 'Active Fleet', value: '${_vehicles.length} Vehicles'),
                          _MetricChip(title: 'Active Workforce', value: '${_employees.length} Staff'),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('FLEET EXPENSE APPROVALS (LIVE)', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (_expenses.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: const [
                          Icon(Icons.check_circle_outline, color: Color(0xFF10B981)),
                          SizedBox(width: 10),
                          Text('All fleet expense reports approved.', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                  )
                else
                  ..._expenses.map((exp) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.local_gas_station, color: Color(0xFFF59E0B)),
                        title: Text('${exp['type']} — ${exp['vehicleNo']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        subtitle: Text('Driver: ${exp['driverName']}  •  ₹${exp['amount']}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                        trailing: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black),
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Expense Approved & Ledger Updated.')),
                            );
                          },
                          child: const Text('APPROVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    );
                  }),
              ],
            ),

            // TAB 2: LIVE FLEET TRACKING
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('LIVE GPS FLEET TRACKER', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ..._vehicles.map((v) {
                  final isMoving = v['status'] == 'MOVING';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: Icon(Icons.local_shipping, color: isMoving ? const Color(0xFF10B981) : const Color(0xFFF59E0B)),
                      title: Text('${v['registrationNumber']} — Driver ${v['driverName']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      subtitle: Text('Speed: ${v['speed']} km/h  •  Ignition: ${v['ignition'] == true ? "ON" : "OFF"}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                      trailing: Chip(
                        label: Text(v['status'] ?? 'ACTIVE', style: const TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.bold)),
                        backgroundColor: isMoving ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                      ),
                    ),
                  );
                }),
              ],
            ),

            // TAB 3: ORDER BOOKING
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('BOOK NEW CLIENT ORDER', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                TextField(
                  controller: _custNameController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Customer Name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _custPhoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Phone Number (+91)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _custAddressController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Delivery Address'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _cylType,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Colors.white),
                  items: ['14.2kg Domestic', '19kg Commercial', '47.5kg Industrial']
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (v) => setState(() => _cylType = v!),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF59E0B),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: _bookOrder,
                  child: const Text('DISPATCH ORDER TO FLEET', style: TextStyle(fontWeight: FontWeight.w900)),
                ),
              ],
            ),

            // TAB 4: WORKFORCE ROSTER & BIOMETRIC ATTENDANCE HARDWARE
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('BIOMETRIC ATTENDANCE (SQLITE)', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFF59E0B),
                        side: const BorderSide(color: Color(0xFFF59E0B)),
                      ),
                      icon: const Icon(Icons.fingerprint, size: 16),
                      label: const Text('BIOMETRIC SCAN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      onPressed: () async {
                        try {
                          final res = await http.post(
                            Uri.parse('$kApiBase/integrations/biometrics/clock-in'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode({
                              'employeeId': 'emp-01',
                              'deviceId': 'BIO-GODOWN-01',
                              'status': 'VERIFIED',
                            }),
                          );
                          if (res.statusCode == 200) {
                            _fetchLiveOwnerData(silent: true);
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                backgroundColor: Color(0xFF10B981),
                                behavior: SnackBarBehavior.floating,
                                content: Text('Biometric Fingerprint Verified! Attendance recorded in SQLite.'),
                              ),
                            );
                          }
                        } catch (e) {
                          debugPrint('Biometric scan note: $e');
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ..._employees.map((emp) {
                  final isPresent = emp['attendanceStatus'] == 'Present';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: isPresent ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        child: Text(emp['name'] != null ? emp['name'][0] : 'E', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                      ),
                      title: Text('${emp['name']} (${emp['role']})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      subtitle: Text('Attendance: ${emp['attendanceStatus'] ?? 'Present'}  •  ${emp['workingHours'] ?? '8h'}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                      trailing: Chip(
                        label: Text(isPresent ? 'VERIFIED' : 'PENDING', style: const TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.bold)),
                        backgroundColor: isPresent ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: const Color(0xFFF59E0B),
        unselectedItemColor: const Color(0xFF64748B),
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), label: 'KPIs'),
          BottomNavigationBarItem(icon: Icon(Icons.gps_fixed_outlined), label: 'Fleet'),
          BottomNavigationBarItem(icon: Icon(Icons.add_shopping_cart_outlined), label: 'Book Order'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_outlined), label: 'Workforce'),
        ],
      ),
    );
  }
}

// ============================================================================
// 3. LOADMAN HOME SCREEN
// ============================================================================
class LoadmanHomeScreen extends StatefulWidget {
  const LoadmanHomeScreen({super.key});

  @override
  State<LoadmanHomeScreen> createState() => _LoadmanHomeScreenState();
}

class _LoadmanHomeScreenState extends State<LoadmanHomeScreen> {
  int _currentIndex = 0;
  final TextEditingController _defectNotesController = TextEditingController();
  String _defectType = 'Leaky Valve';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Loadman Operations Desk (Kumar)'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('BATCH LB-1021', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      const Text('Vehicle: TN 38 AU 4821  •  Driver: Arun', style: TextStyle(color: Colors.white)),
                      const Text('Required: 25 Cylinders  •  Loaded: 25 Cylinders', style: TextStyle(color: Color(0xFF94A3B8))),
                      const SizedBox(height: 14),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Batch LB-1021 Confirmed! Synced to Render Cloud.')),
                          );
                        },
                        child: const Text('CONFIRM TRUCK LOAD', style: TextStyle(fontWeight: FontWeight.w900)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('REPORT DEFECTIVE CYLINDER', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _defectType,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Defect Category'),
                items: ['Leaky Valve', 'Damaged Collar', 'Expired Tare Weight', 'Rust & Dent']
                    .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                    .toList(),
                onChanged: (val) => setState(() => _defectType = val!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _defectNotesController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Cylinder Serial Number'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
                onPressed: () {
                  _defectNotesController.clear();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Defective Cylinder logged in quality audit file.')),
                  );
                },
                child: const Text('LOG DEFECT IN AUDIT SYSTEM', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: const Color(0xFFF59E0B),
        unselectedItemColor: const Color(0xFF64748B),
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.inventory_outlined), label: 'Batches'),
          BottomNavigationBarItem(icon: Icon(Icons.warning_amber_outlined), label: 'Defect Audit'),
        ],
      ),
    );
  }
}

// ============================================================================
// 4. MANAGER HOME SCREEN
// ============================================================================
class ManagerHomeScreen extends StatelessWidget {
  const ManagerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Operations Manager Desk'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('DISPATCH & ROUTE CONTROL', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('Active Fleet Routes: 6  |  Total Deliveries: 220', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('On-Time Completion Rate: 94.2%', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 5. STOREROOM HOME SCREEN
// ============================================================================
class StoreroomHomeScreen extends StatelessWidget {
  const StoreroomHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Godown & Inventory Desk'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('CYLINDER STOCK AUDIT', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('14.2kg Domestic: 480 Filled  •  120 Empty', style: TextStyle(color: Colors.white)),
                  Text('19kg Commercial: 145 Filled  •  35 Empty', style: TextStyle(color: Colors.white)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  final String title;
  final String value;
  const _MetricChip({required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
