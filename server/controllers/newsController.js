const News = require('../models/News');

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find();
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'Tin tức không tồn tại' });
    }
    res.status(200).json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, content, fullContent, image, topic, date } = req.body;
    if (!title || !content || !image || !topic) {
      return res.status(400).json({ message: 'Thiếu các trường bắt buộc' });
    }
    const news = new News({
      title,
      content,
      fullContent, 
      image,
      topic,
      date: date || new Date() 
    });
    const newNews = await news.save();
    res.status(201).json(newNews);
  } catch (err) {
    console.error('Error creating news:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { title, content, fullContent, image, topic, date } = req.body;
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'Tin tức không tồn tại' });
    }
    news.title = title || news.title;
    news.content = content || news.content;
    news.fullContent = fullContent !== undefined ? fullContent : news.fullContent; 
    news.image = image || news.image;
    news.topic = topic || news.topic;
    news.date = date || news.date;
    const updatedNews = await news.save();
    res.json(updatedNews);
  } catch (err) {
    console.error('Error updating news:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'Tin tức không tồn tại' });
    }
    res.json({ message: 'Tin tức đã được xóa' });
  } catch (err) {
    console.error('Error deleting news:', err);
    res.status(500).json({ message: err.message });
  }
};