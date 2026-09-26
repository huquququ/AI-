const express = require('express')
const multer = require('multer')
const path = require('path')
const uploadController = require('../controllers/uploadController')

const router = express.Router()

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true)
      return
    }
    cb(new Error('Only image files are allowed'))
  }
}).single('file')

router.post('/', (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      uploadController.uploadFile(req, res)
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File too large. Max size is 5MB.' })
        return
      }
      res.status(400).json({ error: error.message })
      return
    }

    next(error)
  })
})

router.get('/:id', uploadController.getFile)
router.delete('/:id', uploadController.deleteFile)

module.exports = router
