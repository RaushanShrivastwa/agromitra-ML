const GeneralFaq = require('../models/GeneralFaq');
const ContactQuery = require('../models/ContactQuery');
const Log = require('../models/Log');

exports.getFaqs = async (req, res) => {
  try {
    const faqs = await GeneralFaq.find({}).sort({ createdAt: -1 });
    res.status(200).json({ faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createFaq = async (req, res) => {
  const { question, answer, keywords } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ message: 'Question and Answer are required' });
  }

  try {
    const keywordArray = Array.isArray(keywords) 
      ? keywords 
      : (keywords ? keywords.split(',').map(k => k.trim()) : []);

    const newFaq = await GeneralFaq.create({
      question: question.trim(),
      answer: answer.trim(),
      keywords: keywordArray
    });

    // Log admin action
    await new Log({
      userId: req.user.id,
      action: `Created formal FAQ: "${question.substring(0, 40)}..."`
    }).save();

    res.status(201).json({ message: 'FAQ created successfully', faq: newFaq });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const faq = await GeneralFaq.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    await GeneralFaq.findByIdAndDelete(req.params.id);

    await new Log({
      userId: req.user.id,
      action: `Deleted FAQ ID: ${req.params.id}`
    }).save();

    res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Endpoint for Python Flask ML Service to download all text documents
exports.getTrainingData = async (req, res) => {
  try {
    const faqs = await GeneralFaq.find({});
    const approvedQueries = await ContactQuery.find({ 
      status: 'Answered', 
      approvedForSearch: true 
    });

    res.status(200).json({
      faqs: faqs.map(f => ({
        question: f.question,
        answer: f.answer,
        keywords: f.keywords || []
      })),
      approvedQueries: approvedQueries.map(q => ({
        question: q.subject ? `[${q.subject}] ${q.message}` : q.message,
        answer: q.answer
      }))
    });
  } catch (error) {
    console.error('Error compiling ML training data:', error);
    res.status(500).json({ message: 'Server error compiling training data' });
  }
};
