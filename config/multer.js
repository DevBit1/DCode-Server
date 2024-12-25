const multer = require('multer')
const upload = multer()

const textUpload = upload.none()

module.exports = { textUpload }