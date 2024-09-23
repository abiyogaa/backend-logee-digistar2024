require('dotenv').config();
const mongoose = require('mongoose');
const Fleet = require('../models/Fleet');
const Vehicle = require('../models/Vehicle');
const Review = require('../models/Review');
const fleetData = require('../dummyData/fleets');
const vehicleData = require('../dummyData/vehicles');
const { generateDummyReviews } = require('../dummyData/reviews');

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('MONGODB_URI is not defined in the environment variables');
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Fleet.deleteMany({});
    await Vehicle.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data');

    // Seed fleets
    const fleets = await Fleet.create(fleetData);
    console.log('Seeded fleets');

    // Create a map of fleet names to their ObjectIds
    const fleetMap = new Map(fleets.map(fleet => [fleet.name, fleet._id]));

    // Seed vehicles and reviews
    for (const vehicleInfo of vehicleData) {
      const fleetName = vehicleInfo.fleet;
      const fleetId = fleetMap.get(fleetName);

      if (!fleetId) {
        console.error(`Fleet not found for vehicle: ${vehicleInfo.model}`);
        continue;
      }

      const vehicle = new Vehicle({
        ...vehicleInfo,
        fleet: fleetId
      });

      await vehicle.save();

      // Generate and save dummy reviews
      const dummyReviews = generateDummyReviews(vehicle._id);
      const savedReviews = await Review.create(dummyReviews);

      // Update vehicle with review IDs
      vehicle.reviews = savedReviews.map(review => review._id);
      await vehicle.save();

      // Update the fleet with the new vehicle
      await Fleet.findByIdAndUpdate(fleetId, { $push: { vehicles: vehicle._id } });

      console.log(`Added vehicle: ${vehicle.model} to fleet: ${fleetName} with ${savedReviews.length} reviews`);
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();