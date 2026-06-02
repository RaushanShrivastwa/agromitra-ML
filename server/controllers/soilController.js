const SoilRequest = require('../models/SoilRequest');
const Log = require('../models/Log');

exports.createRequest = async (req, res) => {
  const { address, collectionDate } = req.body;
  if (!address || !collectionDate) {
    return res.status(400).json({ message: 'Address and Collection Date are required' });
  }

  try {
    const newRequest = await SoilRequest.create({
      userId: req.user.id,
      address,
      collectionDate: new Date(collectionDate),
      status: 'Pending'
    });

    // Log the request creation
    await new Log({
      userId: req.user.id,
      action: `Created a Soil Testing request (ID: ${newRequest._id})`,
      status: 'In Progress'
    }).save();

    res.status(201).json({ message: 'Soil request created successfully', request: newRequest });
  } catch (error) {
    console.error('Error creating Soil Request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await SoilRequest.find({ userId: req.user.id }).sort({ collectionDate: -1 });
    res.status(200).json({ requests });
  } catch (error) {
    console.error('Error fetching User Soil Requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
