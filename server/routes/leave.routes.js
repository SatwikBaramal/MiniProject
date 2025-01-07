const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Leave = require('../models/Leave');

// @route   POST api/leave
// @desc    Apply for leave
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { startDate, endDate, type, reason } = req.body;
        console.log('Leave application received:', { startDate, endDate, type, reason, userId: req.user.id });

        // Check for overlapping leaves
        const overlappingLeave = await Leave.findOne({
            user: req.user.id,
            $or: [
                {
                    startDate: { $lte: startDate },
                    endDate: { $gte: startDate }
                },
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: endDate }
                }
            ],
            status: { $ne: 'rejected' }
        });

        if (overlappingLeave) {
            console.log('Overlapping leave found:', overlappingLeave);
            return res.status(400).json({ message: 'You already have a leave application for these dates' });
        }

        const leave = new Leave({
            user: req.user.id,
            startDate,
            endDate,
            type,
            reason
        });

        await leave.save();
        console.log('Leave application saved:', leave);
        res.json(leave);
    } catch (err) {
        console.error('Error in leave application:', err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/leave
// @desc    Get all leaves for current user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        console.log('Fetching leaves for user:', req.user.id);
        const leaves = await Leave.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        console.log('Found leaves:', leaves);
        res.json(leaves);
    } catch (err) {
        console.error('Error fetching leaves:', err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/leave/pending
// @desc    Get pending leaves for manager approval
// @access  Private/Manager
router.get('/pending', protect, authorize('manager', 'admin'), async (req, res) => {
    try {
        console.log('Fetching pending leaves for manager:', req.user.id);
        console.log('User role:', req.user.role);
        
        const leaves = await Leave.find({
            status: 'pending',
            user: { $ne: req.user.id }
        })
        .populate('user', 'name email department')
        .sort({ createdAt: 1 });
        
        console.log('Found pending leaves:', leaves);
        res.json(leaves);
    } catch (err) {
        console.error('Error fetching pending leaves:', err);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/leave/:id
// @desc    Update leave status (approve/reject)
// @access  Private/Manager
router.put('/:id', protect, authorize('manager', 'admin'), async (req, res) => {
    try {
        console.log('Updating leave status:', req.params.id);
        const { status, comments } = req.body;
        
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            console.log('Leave application not found:', req.params.id);
            return res.status(404).json({ message: 'Leave application not found' });
        }

        if (leave.status !== 'pending') {
            console.log('Leave application already processed:', leave);
            return res.status(400).json({ message: 'Leave application already processed' });
        }

        leave.status = status;
        leave.approvedBy = req.user.id;
        leave.approvalDate = new Date();
        leave.approvalComments = comments;

        await leave.save();
        console.log('Leave status updated:', leave);
        res.json(leave);
    } catch (err) {
        console.error('Error updating leave status:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
