module.exports= {

  logStart() {
    console.log('Bot has been started...')
  },

  msgReceived() {
    console.log('Message received')
  },

  getChatId(msg) {
    return msg.chat.id
  }
};