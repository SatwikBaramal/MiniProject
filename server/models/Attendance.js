const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        time: Date,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    },
    checkOut: {
        time: Date,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'half-day', 'leave'],
        default: 'absent'
    },
    workHours: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for geospatial queries
attendanceSchema.index({ "checkIn.location": "2dsphere" });
attendanceSchema.index({ "checkOut.location": "2dsphere" });

module.exports = mongoose.model('Attendance', attendanceSchema);
