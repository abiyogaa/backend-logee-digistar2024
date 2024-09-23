const mongoose = require('mongoose');
const Fleet = require('../models/Fleet');

// List all fleets
exports.listFleets = async (req, res) => {
  try {
    const fleets = await Fleet.find();
    res.status(200).json(fleets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fleets', error: error.message });
  }
};

// Create a new fleet
exports.createFleet = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: 'Please provide both name and description' });
  }
  try {
    const newFleet = new Fleet({ name, description });
    await newFleet.save();
    res.status(201).json(newFleet);
  } catch (error) {
    res.status(500).json({ message: 'Error creating fleet', error: error.message });
  }
};

// Get fleet details by ID
exports.getFleetDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid fleet ID' });
  }
  try {
    const fleet = await Fleet.findById(id);
    if (!fleet) {
      return res.status(404).json({ message: 'Fleet not found' });
    }
    res.status(200).json(fleet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fleet details', error: error.message });
  }
};

// Update a fleet by ID
exports.updateFleet = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid fleet ID' });
  }
  try {
    const updatedFleet = await Fleet.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedFleet) {
      return res.status(404).json({ message: 'Fleet not found' });
    }
    res.status(200).json(updatedFleet);
  } catch (error) {
    res.status(500).json({ message: 'Error updating fleet', error: error.message });
  }
};

// Delete a fleet by ID
exports.deleteFleet = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid fleet ID' });
  }
  try {
    const deletedFleet = await Fleet.findByIdAndDelete(id);
    if (!deletedFleet) {
      return res.status(404).json({ message: 'Fleet not found' });
    }
    res.status(200).json({ message: 'Fleet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fleet', error: error.message });
  }
};
