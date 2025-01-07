const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Office = require('../models/Office');

// @route   POST api/attendance/check-in
// @desc    Mark attendance check-in
// @access  Private
router.post('/check-in', protect, async (req, res) => {
    try {
        const { coordinates } = req.body;
        
        // Check if user already checked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let attendance = await Attendance.findOne({
            user: req.user.id,
            date: today
        });

        if (attendance && attendance.checkIn) {
            return res.status(400).json({ message: 'Already checked in today' });
        }

        // Verify if user is within office premises
        const office = await Office.findById(req.user.office);
        if (!office) {
            return res.status(400).json({ message: 'Office location not found' });
        }

        // Calculate distance between user and office
        const distance = getDistance(coordinates, office.location.coordinates);
        if (distance > office.radius) {
            return res.status(400).json({ message: 'You are not within office premises' });
        }

        if (!attendance) {
            attendance = new Attendance({
                user: req.user.id,
                date: today
            });
        }

        attendance.checkIn = {
            time: new Date(),
            location: {
                type: 'Point',
                coordinates
            }
        };
        attendance.status = 'present';
        
        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/attendance/check-out
// @desc    Mark attendance check-out
// @access  Private
router.post('/check-out', protect, async (req, res) => {
    try {
        const { coordinates } = req.body;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendance = await Attendance.findOne({
            user: req.user.id,
            date: today
        });

        if (!attendance || !attendance.checkIn) {
            return res.status(400).json({ message: 'No check-in found for today' });
        }

        if (attendance.checkOut) {
            return res.status(400).json({ message: 'Already checked out today' });
        }

        attendance.checkOut = {
            time: new Date(),
            location: {
                type: 'Point',
                coordinates
            }
        };

        // Calculate work hours
        const checkInTime = new Date(attendance.checkIn.time).getTime();
        const checkOutTime = new Date().getTime();
        attendance.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/attendance/history
// @desc    Get attendance history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { user: req.user.id };
        
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query).sort({ date: -1 });
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Helper function to calculate distance between two points
function getDistance(coords1, coords2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coords1[1] * Math.PI/180;
    const φ2 = coords2[1] * Math.PI/180;
    const Δφ = (coords2[1]-coords1[1]) * Math.PI/180;
    const Δλ = (coords2[0]-coords1[0]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}

module.exports = router;
