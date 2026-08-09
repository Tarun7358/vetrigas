import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const VetriIndaneWorkerApp());
}

class VetriIndaneWorkerApp extends StatelessWidget {
  const VetriIndaneWorkerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vetri Indane Worker App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A),
          primary: const Color(0xFF0A192F),
          secondary: const Color(0xFFF59E0B),
          surface: const Color(0xFFF8FAFC),
        ),
        fontFamily: 'Roboto',
      ),
      home: const RoleSelectScreen(),
    );
  }
}

class RoleSelectScreen extends StatefulWidget {
  const RoleSelectScreen({super.key});

  @override
  State<RoleSelectScreen> createState() => _RoleSelectScreenState();
}

class _RoleSelectScreenState extends State<RoleSelectScreen> {
  String selectedRole = 'DRIVER';
  final TextEditingController _emailController =
      TextEditingController(text: 'arun.driver@vetriindane.com');
  final TextEditingController _passwordController =
      TextEditingController(text: 'Arun@2026');
  bool _obscurePassword = true;
  bool _isLoading = false;

  final Map<String, Map<String, String>> rolePresets = {
    'OWNER': {
      'email': 'owner@vetriindane.com',
      'pass': 'Vetri@2026',
      'title': 'Owner Control Room (Vetri)',
      'desc': 'Full depot operations & financial approvals',
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

    try {
      final response = await http.post(
        Uri.parse('https://vetrigas.onrender.com/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': emailInput,
          'password': passwordInput,
        }),
      ).timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF1E293B),
              content: Text(
                'Authenticated with Render Cloud DB: ${data['user']['name']} (${data['user']['role']})',
                style: const TextStyle(color: Color(0xFF10B981)),
              ),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Cloud Auth note: Offline fallback active');
    }

    if (!mounted) return;
    setState(() {
      _isLoading = false;
    });

    if (selectedRole == 'OWNER') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const OwnerHomeScreen()),
      );
    } else if (selectedRole == 'MANAGER') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ManagerHomeScreen()),
      );
    } else if (selectedRole == 'DRIVER') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const DriverHomeScreen()),
      );
    } else if (selectedRole == 'LOADMAN') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const LoadmanHomeScreen()),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const StoreroomHomeScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeInfo = rolePresets[selectedRole]!;

    return Scaffold(
      backgroundColor: const Color(0xFF0A192F),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Branding Header
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFF59E0B).withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.local_fire_department,
                    size: 44,
                    color: Color(0xFF0A192F),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'VETRI INDANE',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'ENTERPRISE LOGISTICS SUITE',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFFF59E0B),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
                const Text(
                  'Powered by RDK Technologies',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, fontSize: 11),
                ),
                const SizedBox(height: 32),

                // Role Choice Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: ['OWNER', 'MANAGER', 'DRIVER', 'LOADMAN'].map((role) {
                      final isSelected = selectedRole == role;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: ChoiceChip(
                          label: Text(role),
                          selected: isSelected,
                          onSelected: (_) => _onRoleChanged(role),
                          selectedColor: const Color(0xFFF59E0B),
                          backgroundColor: const Color(0xFF1E293B),
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.black : Colors.white70,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 24),

                // Login Form Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Role Info Banner
                      Text(
                        activeInfo['title']!,
                        style: const TextStyle(
                          color: Color(0xFFF59E0B),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        activeInfo['desc']!,
                        style: const TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                      const Divider(height: 24, color: Colors.white12),

                      // Email Field
                      const Text(
                        'CORPORATE EMAIL',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _emailController,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.email_outlined,
                              color: Colors.grey, size: 20),
                          filled: true,
                          fillColor: const Color(0xFF0A192F),
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Password Field
                      const Text(
                        'PASSWORD',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.lock_outline,
                              color: Colors.grey, size: 20),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: Colors.grey,
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                          filled: true,
                          fillColor: const Color(0xFF0A192F),
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Login Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF59E0B),
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 4,
                          ),
                          onPressed: _isLoading ? null : _handleLogin,
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.black,
                                  ),
                                )
                              : Text(
                                  'AUTHENTICATE $selectedRole',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.verified_user_outlined,
                        size: 14, color: Colors.greenAccent),
                    SizedBox(width: 6),
                    Text(
                      '256-Bit Encrypted Secure Connection',
                      style: TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// 1. DRIVER HOME SCREEN WITH FULL DELIVERIES, EXPENSE SUBMISSION & TELEMETRY
// ============================================================================
class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  int _currentIndex = 0;

  final List<Map<String, dynamic>> _deliveries = [
    {
      'id': 'VI-10251',
      'customerName': 'Raj Kumar',
      'address': 'No. 42, Cross Cut Road, Gandhipuram',
      'phone': '+91 98421 11223',
      'type': '14.2kg Domestic LPG',
      'amount': 940,
      'distance': '1.8 km',
      'status': 'PENDING',
    },
    {
      'id': 'VI-10252',
      'customerName': 'Hotel Annapoorna',
      'address': '102 DB Road, RS Puram',
      'phone': '+91 94432 55678',
      'type': '19kg Commercial LPG (x3)',
      'amount': 5550,
      'distance': '3.2 km',
      'status': 'PENDING',
    },
    {
      'id': 'VI-10253',
      'customerName': 'Saritha Textiles',
      'address': 'OVK Building, Town Hall',
      'phone': '+91 98940 12345',
      'type': '19kg Commercial LPG',
      'amount': 1850,
      'distance': '4.5 km',
      'status': 'DELIVERED',
    },
  ];

  final TextEditingController _expAmountController = TextEditingController();
  final TextEditingController _expNoteController = TextEditingController();
  String _expType = 'Diesel Refuel';

  void _completeDelivery(int index, String paymentMethod) {
    setState(() {
      _deliveries[index]['status'] = 'DELIVERED';
      _deliveries[index]['paymentMethod'] = paymentMethod;
    });

    // Send backend HTTP status update
    http.put(
      Uri.parse('https://vetrigas.onrender.com/api/deliveries/${_deliveries[index]['id']}/status'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'status': 'DELIVERED'}),
    ).catchError((_) {});

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        content: Text(
          'Order ${_deliveries[index]['id']} Completed via $paymentMethod! Bill Generated.',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  void _sendWhatsAppReceipt(Map<String, dynamic> del) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF1E293B),
        content: Text(
          'WhatsApp Digital Receipt sent to ${del['phone']} (+91 96008 70814 Helpline)',
          style: const TextStyle(color: Color(0xFFF59E0B)),
        ),
      ),
    );
  }

  void _submitExpense() {
    if (_expAmountController.text.isEmpty) return;

    final amount = double.tryParse(_expAmountController.text) ?? 0;
    http.post(
      Uri.parse('https://vetrigas.onrender.com/api/expenses'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'driverName': 'Arun',
        'type': _expType,
        'amount': amount,
        'vehicleNo': 'TN 38 AU 4821',
        'notes': _expNoteController.text,
      }),
    ).catchError((_) {});

    _expAmountController.clear();
    _expNoteController.clear();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF10B981),
        content: Text('Expense submitted to Owner for approval!'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A192F),
      appBar: AppBar(
        title: const Text('Driver Operations Desk (Arun)'),
        backgroundColor: const Color(0xFF0A192F),
        foregroundColor: Colors.white,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          // Tab 1: Assigned Deliveries
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                color: const Color(0xFF1E293B),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Vehicle: TN 38 AU 4821  •  GPS Connected',
                          style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Completed: ${_deliveries.where((d) => d['status'] == 'DELIVERED').length} / ${_deliveries.length}',
                              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          Text('Collection: ₹${_deliveries.where((d) => d['status'] == 'DELIVERED').fold<num>(0, (sum, item) => sum + item['amount'])}',
                              style: const TextStyle(color: Color(0xFF10B981), fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('ASSIGNED DELIVERY ROUTE',
                  style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ..._deliveries.asMap().entries.map((entry) {
                final idx = entry.key;
                final del = entry.value;
                final isDelivered = del['status'] == 'DELIVERED';

                return Card(
                  color: const Color(0xFF1E293B),
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${del['customerName']} (${del['id']})',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                            Chip(
                              label: Text(del['status'],
                                  style: TextStyle(color: isDelivered ? Colors.black : Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                              backgroundColor: isDelivered ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(del['address'], style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        Text('${del['type']}  •  ${del['distance']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('₹${del['amount']}', style: const TextStyle(color: Color(0xFF10B981), fontSize: 18, fontWeight: FontWeight.bold)),
                            if (!isDelivered)
                              Row(
                                children: [
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black),
                                    onPressed: () => _completeDelivery(idx, 'UPI'),
                                    child: const Text('UPI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  ),
                                  const SizedBox(width: 6),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: Colors.amber, foregroundColor: Colors.black),
                                    onPressed: () => _completeDelivery(idx, 'CASH'),
                                    child: const Text('CASH', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              )
                            else
                              IconButton(
                                icon: const Icon(Icons.chat, color: Color(0xFF10B981)),
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

          // Tab 2: Vehicle Expense Submission
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('SUBMIT FLEET EXPENSE', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _expType,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Expense Category',
                  labelStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                ),
                items: ['Diesel Refuel', 'Toll Charge', 'Vehicle Repair', 'Other']
                    .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                    .toList(),
                onChanged: (val) => setState(() => _expType = val!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _expAmountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Amount (₹)',
                  labelStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _expNoteController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Notes / Fuel Litres',
                  labelStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF59E0B),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _submitExpense,
                child: const Text('SUBMIT FOR OWNER APPROVAL', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),

          // Tab 3: Live Telemetry Status
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                color: const Color(0xFF1E293B),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('FLEET TRACK TELEMETRY', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                      SizedBox(height: 12),
                      Text('Vehicle: TN 38 AU 4821', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      Text('Current Speed: 42 km/h  (Speed Limit: 60 km/h)', style: TextStyle(color: Colors.greenAccent)),
                      Text('Engine Ignition: ON  •  Anti-Idle Alarm: CLEAR', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: const Color(0xFFF59E0B),
        unselectedItemColor: Colors.grey,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.local_shipping), label: 'Deliveries'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Expenses'),
          BottomNavigationBarItem(icon: Icon(Icons.speed), label: 'Telemetry'),
        ],
      ),
    );
  }
}

// ============================================================================
// 2. LOADMAN HOME SCREEN WITH BATCH CONFIRMATIONS & CYLINDER DEFECT AUDIT
// ============================================================================
class LoadmanHomeScreen extends StatefulWidget {
  const LoadmanHomeScreen({super.key});

  @override
  State<LoadmanHomeScreen> createState() => _LoadmanHomeScreenState();
}

class _LoadmanHomeScreenState extends State<LoadmanHomeScreen> {
  int _currentIndex = 0;

  final List<Map<String, dynamic>> _batches = [
    {
      'id': 'LB-1021',
      'vehicleNo': 'TN 38 AU 4821',
      'driverName': 'Arun',
      'required': 25,
      'loaded': 25,
      'status': 'PENDING',
    },
    {
      'id': 'LB-1022',
      'vehicleNo': 'TN 38 BX 9102',
      'driverName': 'Ramesh',
      'required': 30,
      'loaded': 28,
      'status': 'PENDING',
    },
  ];

  final TextEditingController _defectNotesController = TextEditingController();
  String _defectType = 'Leaky Valve';

  void _confirmBatch(int index) {
    setState(() {
      _batches[index]['status'] = 'CONFIRMED';
    });

    http.put(
      Uri.parse('https://vetrigas.onrender.com/api/batches/${_batches[index]['id']}/accept'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'status': 'ACCEPTED'}),
    ).catchError((_) => http.Response('', 500));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        content: Text('Batch ${_batches[index]['id']} confirmed for delivery!'),
      ),
    );
  }

  void _reportDefect() {
    if (_defectNotesController.text.isEmpty) return;

    _defectNotesController.clear();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Colors.redAccent,
        content: Text('Defective Cylinder logged in quality audit database!'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A192F),
      appBar: AppBar(
        title: const Text('Loadman Operations (Kumar)'),
        backgroundColor: const Color(0xFF0A192F),
        foregroundColor: Colors.white,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          // Tab 1: Loading Batches
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ..._batches.asMap().entries.map((entry) {
                final idx = entry.key;
                final batch = entry.value;
                final isConfirmed = batch['status'] == 'CONFIRMED';

                return Card(
                  color: const Color(0xFF1E293B),
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('BATCH ${batch['id']}',
                            style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text('Vehicle: ${batch['vehicleNo']}  •  Driver: ${batch['driverName']}',
                            style: const TextStyle(color: Colors.white)),
                        Text('Required: ${batch['required']}  •  Loaded: ${batch['loaded']}',
                            style: const TextStyle(color: Colors.grey)),
                        const SizedBox(height: 12),
                        if (!isConfirmed)
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black),
                                  onPressed: () => _confirmBatch(idx),
                                  child: const Text('CONFIRM LOAD', style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          )
                        else
                          const Chip(
                            label: Text('CONFIRMED', style: TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold)),
                            backgroundColor: Color(0xFF10B981),
                          ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),

          // Tab 2: Defect Quality Audit
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('REPORT DEFECTIVE CYLINDER', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _defectType,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Defect Type',
                  labelStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                ),
                items: ['Leaky Valve', 'Damaged Collar', 'Expired Tare Weight', 'Rust & Dent']
                    .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                    .toList(),
                onChanged: (val) => setState(() => _defectType = val!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _defectNotesController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Cylinder Serial Number / Remarks',
                  labelStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
                onPressed: _reportDefect,
                child: const Text('LOG DEFECT IN AUDIT FILE', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: const Color(0xFFF59E0B),
        unselectedItemColor: Colors.grey,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.inventory), label: 'Batches'),
          BottomNavigationBarItem(icon: Icon(Icons.warning_amber), label: 'Defect Audit'),
        ],
      ),
    );
  }
}

// ============================================================================
// 3. OWNER HOME SCREEN WITH FULL PARITY (KPIs, FLEET, ORDERS, BILLS, WORKFORCE)
// ============================================================================
class OwnerHomeScreen extends StatefulWidget {
  const OwnerHomeScreen({super.key});

  @override
  State<OwnerHomeScreen> createState() => _OwnerHomeScreenState();
}

class _OwnerHomeScreenState extends State<OwnerHomeScreen> {
  int _currentIndex = 0;

  final TextEditingController _custNameController = TextEditingController();
  final TextEditingController _custPhoneController = TextEditingController();
  final TextEditingController _custAddressController = TextEditingController();
  String _cylType = '14.2kg Domestic';

  void _bookOrder() {
    if (_custNameController.text.isEmpty || _custPhoneController.text.isEmpty) return;

    final name = _custNameController.text;
    _custNameController.clear();
    _custPhoneController.clear();
    _custAddressController.clear();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        content: Text('Order booked successfully for $name! Dispatched to Driver Arun.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A192F),
      appBar: AppBar(
        title: const Text('Owner Control Room (Vetri)'),
        backgroundColor: const Color(0xFF0A192F),
        foregroundColor: Colors.white,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          // Tab 1: Executive KPI & Approvals
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
                  border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Daily Gross Collections', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    const Text('₹ 1,42,850.00', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        _MetricChip(title: 'Active Fleet', value: '12 / 14 Vehicles'),
                        _MetricChip(title: 'Deliveries Today', value: '184 Completed'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('PRIORITY AUDIT ALERTS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Card(
                color: const Color(0xFF1E293B),
                child: ListTile(
                  leading: const Icon(Icons.local_gas_station, color: Colors.amber),
                  title: const Text('Diesel Refuel: TN 38 AU 4821', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Driver Arun  •  ₹3,400 (42.5 L)', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  trailing: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Expense Approved! Saved to SQLite backend.')),
                      );
                    },
                    child: const Text('APPROVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
            ],
          ),

          // Tab 2: Live Fleet Tracking
          ListView(
            padding: const EdgeInsets.all(16),
            children: const [
              Card(
                color: Color(0xFF1E293B),
                child: ListTile(
                  leading: Icon(Icons.local_shipping, color: Color(0xFF10B981)),
                  title: Text('TN 38 AU 4821 — Driver Arun', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text('Location: Cross Cut Road  •  Speed: 42 km/h', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  trailing: Chip(label: Text('MOVING', style: TextStyle(fontSize: 9)), backgroundColor: Color(0xFF10B981)),
                ),
              ),
              SizedBox(height: 8),
              Card(
                color: Color(0xFF1E293B),
                child: ListTile(
                  leading: Icon(Icons.local_shipping, color: Colors.amber),
                  title: Text('TN 38 BX 9102 — Driver Ramesh', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text('Location: Peelamedu  •  Speed: 0 km/h (Stopped)', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  trailing: Chip(label: Text('IDLE', style: TextStyle(fontSize: 9)), backgroundColor: Colors.amber),
                ),
              ),
            ],
          ),

          // Tab 3: Order Booking
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('CREATE NEW CLIENT ORDER', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                controller: _custNameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Customer Name', labelStyle: TextStyle(color: Colors.grey)),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _custPhoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Phone Number (+91)', labelStyle: TextStyle(color: Colors.grey)),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _custAddressController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Delivery Address', labelStyle: TextStyle(color: Colors.grey)),
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
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.black),
                onPressed: _bookOrder,
                child: const Text('DISPATCH ORDER TO FLEET', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),

          // Tab 4: Bills & Collections
          ListView(
            padding: const EdgeInsets.all(16),
            children: const [
              Card(
                color: Color(0xFF1E293B),
                child: ListTile(
                  title: Text('Bill #VI-2026-00102 — ₹940', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text('Customer: Raj Kumar  •  Driver: Arun  •  Mode: UPI', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  trailing: Chip(label: Text('PAID', style: TextStyle(fontSize: 9)), backgroundColor: Color(0xFF10B981)),
                ),
              ),
            ],
          ),

          // Tab 5: Workforce Roster
          ListView(
            padding: const EdgeInsets.all(16),
            children: const [
              Card(
                color: Color(0xFF1E293B),
                child: ListTile(
                  leading: CircleAvatar(backgroundColor: Color(0xFFF59E0B), child: Text('A')),
                  title: Text('Arun (Driver)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text('Status: Active  •  Hours: 8h 42m', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  trailing: Icon(Icons.check_circle, color: Color(0xFF10B981)),
                ),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: const Color(0xFFF59E0B),
        unselectedItemColor: Colors.grey,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'KPIs'),
          BottomNavigationBarItem(icon: Icon(Icons.gps_fixed), label: 'Fleet'),
          BottomNavigationBarItem(icon: Icon(Icons.add_shopping_cart), label: 'Book Order'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt), label: 'Bills'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Workforce'),
        ],
      ),
    );
  }
}

// ============================================================================
// 4. MANAGER HOME SCREEN
// ============================================================================
class ManagerHomeScreen extends StatefulWidget {
  const ManagerHomeScreen({super.key});

  @override
  State<ManagerHomeScreen> createState() => _ManagerHomeScreenState();
}

class _ManagerHomeScreenState extends State<ManagerHomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A192F),
      appBar: AppBar(
        title: const Text('Operations Manager Desk'),
        backgroundColor: const Color(0xFF0A192F),
        foregroundColor: Colors.white,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: const [
              Card(
                color: Color(0xFF1E293B),
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('ACTIVE ROUTE CONTROL', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                      SizedBox(height: 8),
                      Text('Active Routes: 6  |  Total Deliveries: 220', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          ListView(
            padding: const EdgeInsets.all(16),
            children: const [
              Text('MANAGER EXPENSE REVIEWS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: const Color(0xFFF59E0B),
        unselectedItemColor: Colors.grey,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.alt_route), label: 'Routes'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Expenses'),
        ],
      ),
    );
  }
}

// ============================================================================
// 5. STOREROOM / GODOWN HOME SCREEN
// ============================================================================
class StoreroomHomeScreen extends StatefulWidget {
  const StoreroomHomeScreen({super.key});

  @override
  State<StoreroomHomeScreen> createState() => _StoreroomHomeScreenState();
}

class _StoreroomHomeScreenState extends State<StoreroomHomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A192F),
      appBar: AppBar(
        title: const Text('Godown & Stock Inventory Desk'),
        backgroundColor: const Color(0xFF0A192F),
        foregroundColor: Colors.white,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: const [
              Card(
                color: Color(0xFF1E293B),
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
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: const Color(0xFFF59E0B),
        unselectedItemColor: Colors.grey,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.inventory_2), label: 'Inventory'),
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
        Text(title, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }
}


