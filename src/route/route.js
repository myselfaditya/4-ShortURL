const express = require('express')
const router = express.Router()
const {createUrl} = require("../controller/urlController")

router.post ("/url/shorten", createUrl)


module.exports=router