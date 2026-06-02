const Notification = require('../models/Notification');
const Log = require('../models/Log');

exports.createNotification = async (req, res) => {
  const { message, targetRole } = req.body;
  if (!message || !targetRole) {
    return res.status(400).json({ message: 'Message and Target Role are required' });
  }

  try {
    const newNotif = await Notification.create({
      message: message.trim(),
      targetRole
    });

    await new Log({
      userId: req.user.id,
      action: `Broadcasted notification to ${targetRole}: "${message.substring(0, 40)}..."`
    }).save();

    res.status(201).json({ message: 'Notification broadcasted successfully', notification: newNotif });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};
    if (userRole !== 'admin') {
      query = { targetRole: { $in: ['All', userRole] } };
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
