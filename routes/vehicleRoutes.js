const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/list', vehicleController.listVehicles);
router.post('/create', vehicleController.createVehicle);
router.get('/details/:id', vehicleController.getVehicleDetails);
router.put('/update/:id', vehicleController.updateVehicle);
router.delete('/delete/:id', vehicleController.deleteVehicle);

router.get('/nearby', vehicleController.findNearbyVehicles);

router.get('/:id/reviews', vehicleController.getVehicleReviews);
router.post('/:id/reviews', vehicleController.addVehicleReview);

module.exports = router;
