const express = require('express');
const router = express.Router();
const fleetController = require('../controllers/fleetController');

router.get('/list', fleetController.listFleets);
router.post('/create', fleetController.createFleet);
router.get('/details/:id', fleetController.getFleetDetails);
router.put('/update/:id', fleetController.updateFleet);
router.delete('/delete/:id', fleetController.deleteFleet);

module.exports = router;