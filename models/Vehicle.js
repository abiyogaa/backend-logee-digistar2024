const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['ready', 'in_use', 'maintenance', 'out_of_service'],
    default: 'ready'
  },
  mileage: {
    type: Number,
    default: 0
  },
  pricePerMile: {
    type: Number,
    required: true,
    min: 0
  },
  maxWeight: {
    type: Number,
    required: true
  },
  maxDimensions: {
    length: {
      type: Number,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  },
  description: {
    type: String,
    trim: true
  },
  fleet: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Fleet'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && 
                 v[1] >= -90 && v[1] <= 90;
        },
        message: props => `${props.value} is not a valid location coordinate!`
      }
    }
  },
  serviceType: {
    type: String,
    enum: ['collection', 'drop-off'],
    required: true,
    default: 'collection'
  },
  photos: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 3;
      },
      message: props => `A vehicle can have at most 3 photos!`
    }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }]
});

// Add a 2dsphere index on the location field
VehicleSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Vehicle', VehicleSchema);