const mongoose = require('mongoose');
const User = require('../models/User');
const Office = require('../models/Office');
require('dotenv').config();

const users = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administration'
    },
    {
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'manager123',
        role: 'manager',
        department: 'IT'
    },
    {
        name: 'Employee User',
        email: 'employee@example.com',
        password: 'employee123',
        role: 'employee',
        department: 'IT'
    }
];

const offices = [
    {
        name: 'Main Office',
        address: '123 Main St, City',
        location: {
            type: 'Point',
            coordinates: [72.8777, 19.0760] // Example coordinates (Mumbai)
        },
        radius: 100 // 100 meters radius
    }
];

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hr-attendance', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await Office.deleteMany({});
        console.log('Existing data cleared');

        // Insert offices
        const createdOffices = await Office.create(offices);
        console.log('Offices created');

        // Insert users with office reference
        const usersWithOffice = users.map(user => ({
            ...user,
            office: createdOffices[0]._id
        }));
        await User.create(usersWithOffice);
        console.log('Users created');

        // Set manager reference for employee
        const manager = await User.findOne({ role: 'manager' });
        await User.updateOne(
            { role: 'employee' },
            { manager: manager._id }
        );
        console.log('Manager references set');

        console.log('Data seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
