const mongoose = require('mongoose');

const officeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
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
    },
    radius: {
        type: Number,
        required: true,
        default: 100 // radius in meters for geo-fencing
    }
}, {
    timestamps: true
});

// Index for geospatial queries
officeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Office', officeSchema);
