const Vehicle = require('../models/Vehicle');
const Fleet = require('../models/Fleet');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Review = require('../models/Review');

// List all vehicles
exports.listVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
};

// Create a new vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { fleet, location, ...vehicleData } = req.body;
    
    if (!fleet) {
      return res.status(400).json({ message: 'Fleet is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(fleet)) {
      return res.status(400).json({ message: 'Invalid fleet ID' });
    }

    // Check if the fleet exists
    const fleetDoc = await Fleet.findById(fleet);
    if (!fleetDoc) {
      return res.status(404).json({ message: 'Fleet not found' });
    }

    // Validate location
    if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Invalid location format' });
    }

    const [longitude, latitude] = location.coordinates;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    // Handle photo uploads
    const photos = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ message: 'A maximum of 3 photos can be uploaded' });
      }
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join('uploads', 'vehicles', fileName);
        await fs.promises.writeFile(filePath, file.buffer);
        photos.push(filePath);
      }
    }

    const newVehicle = new Vehicle({ 
      ...vehicleData, 
      fleet,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      photos
    });
    await newVehicle.save();

    // Update the fleet with the new vehicle
    await Fleet.findByIdAndUpdate(
      fleet,
      { $push: { vehicles: newVehicle._id } },
      { new: true, runValidators: true }
    );

    res.status(201).json(newVehicle);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating vehicle', error: error.message });
  }
};

// Get vehicle details by ID
exports.getVehicleDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }
  try {
    const vehicle = await Vehicle.findById(id).populate('fleet', 'name');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle details', error: error.message });
  }
};

// Update a vehicle by ID
exports.updateVehicle = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }

  try {
    const { location, ...updateData } = req.body;
    
    if (location) {
      // Validate location
      if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({ message: 'Invalid location format' });
      }

      const [longitude, latitude] = location.coordinates;
      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    // Handle photo uploads
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ message: 'A maximum of 3 photos can be uploaded' });
      }
      
      // Delete old photos
      const existingVehicle = await Vehicle.findById(id);
      if (existingVehicle) {
        for (const oldPhoto of existingVehicle.photos) {
          await fs.unlink(oldPhoto).catch(err => console.error('Error deleting old photo:', err));
        }
      }

      const photos = [];
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join('uploads', 'vehicles', fileName);
        await fs.writeFile(filePath, file.buffer);
        photos.push(filePath);
      }
      updateData.photos = photos;
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (updateData.fleet) {
      // Remove vehicle from all fleets
      await Fleet.updateMany(
        { vehicles: id },
        { $pull: { vehicles: id } }
      );
      // Add vehicle to the new fleet
      await Fleet.findByIdAndUpdate(
        updateData.fleet,
        { $addToSet: { vehicles: id } },
        { new: true }
      );
    }

    res.status(200).json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle', error: error.message });
  }
};

// Delete a vehicle by ID
exports.deleteVehicle = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }

  try {
    const deletedVehicle = await Vehicle.findByIdAndDelete(id);
    if (!deletedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Remove vehicle from all fleets
    await Fleet.updateMany(
      { vehicles: id },
      { $pull: { vehicles: id } }
    );

    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vehicle', error: error.message });
  }
};

// Updated function to find nearby vehicles with multiple item calculations
exports.findNearbyVehicles = async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      maxDistance = 50000, 
      brand, 
      model, 
      type,
      itemLength,
      itemWidth,
      itemHeight,
      itemWeight,
      itemCount
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lat, lng]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    };

    // Add filter for brand and/or model if provided
    if (brand) query.brand = brand;
    if (model) query.model = model;

    // Add filter for service type (collection or drop-off)
    if (type === 'collection' || type === 'drop-off') {
      query.serviceType = type;
    }

    // Fetch vehicles that meet the basic criteria
    let nearbyVehicles = await Vehicle.find(query).populate('fleet', 'name');

    // If item details are provided, filter vehicles based on loading capacity
    if (itemLength && itemWidth && itemHeight && itemWeight && itemCount) {
      const length = parseFloat(itemLength);
      const width = parseFloat(itemWidth);
      const height = parseFloat(itemHeight);
      const weight = parseFloat(itemWeight);
      const count = parseInt(itemCount);

      nearbyVehicles = nearbyVehicles.filter(vehicle => {
        // Check if items fit within the vehicle's dimensions
        const fitsLength = length <= vehicle.maxDimensions.length;
        const fitsWidth = width <= vehicle.maxDimensions.width;
        const fitsHeight = height <= vehicle.maxDimensions.height;
        
        // Calculate total volume needed for items
        const itemVolume = length * width * height * count;
        const vehicleVolume = vehicle.maxDimensions.length * vehicle.maxDimensions.width * vehicle.maxDimensions.height;
        const fitsVolume = itemVolume <= vehicleVolume;

        // Check if total weight is within vehicle's capacity
        const totalWeight = weight * count;
        const fitsWeight = totalWeight <= vehicle.maxWeight;

        // Vehicle is suitable if it meets all criteria
        return fitsLength && fitsWidth && fitsHeight && fitsVolume && fitsWeight;
      });
    }

    res.status(200).json(nearbyVehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error finding nearby vehicles', error: error.message });
  }
};

// Add this new function
exports.getVehicleReviews = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }
  try {
    const reviews = await Review.find({ vehicle: id }).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle reviews', error: error.message });
  }
};

exports.addVehicleReview = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }
  try {
    const { rating, title, content, reviewerName } = req.body;
    const newReview = new Review({
      vehicle: id,
      rating,
      title,
      content,
      reviewerName
    });
    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: 'Error adding vehicle review', error: error.message });
  }
};