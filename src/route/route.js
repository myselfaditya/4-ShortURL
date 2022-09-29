const express = require('express')
const router = express.Router()
const {createUrl, getUrl} = require("../controller/urlController")

router.post ("/url/shorten", createUrl)

router.get('/:urlCode',getUrl)

module.exports=router