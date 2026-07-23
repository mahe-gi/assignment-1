const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const LeaveRequest = require('../src/models/LeaveRequest');

const seedUsers = [
  {
    name: 'Demo Manager',
    email: 'manager@example.com',
    password: 'Manager@123',
    role: 'Manager',
    annualLeaveBalance: 20,
    remainingLeaveBalance: 20
  },
  {
    name: 'Demo Employee',
    email: 'employee@example.com',
    password: 'Employee@123',
    role: 'Employee',
    annualLeaveBalance: 20,
    remainingLeaveBalance: 20
  },
  {
    name: 'Second Employee',
    email: 'employee2@example.com',
    password: 'Employee@123',
    role: 'Employee',
    annualLeaveBalance: 20,
    remainingLeaveBalance: 20
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee_leave_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing leave requests for a clean state
    await LeaveRequest.deleteMany({});
    console.log('Cleared existing leave requests.');

    for (const userData of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      await User.findOneAndUpdate(
        { email: userData.email },
        {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          annualLeaveBalance: userData.annualLeaveBalance,
          remainingLeaveBalance: userData.remainingLeaveBalance
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Seeded user: ${userData.name} (${userData.email}) [${userData.role}]`);
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
