const Message = require('../model/Message')
const { getUserDataFromRequest } = require('../utils/getUserDataFromRequest')

exports.getMessagesByUserId = async (req, res) => {
    const { userId } = req.params
    const userData = await getUserDataFromRequest(req)

    const ourUserId = userData.userId

    const messages = await Message.find({
        sender: { $in: [userId, ourUserId] },
        recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
}