const urlModel = require("../model/urlModel");
const shortId = require("shortid");
const validUrl = require("valid-url");
const shortid = require("shortid");

const createUrl = async function (req, res) {
  const longUrl = req.body.longUrl;

  const baseUrl = "localhost:3000/";

  if (!longUrl)
    return res.status(400).send({ status: false, msg: "please provide url." });
    

  if (!validUrl.isUri(longUrl))
    return res
      .status(400)
      .send({ status: false, msg: "please provide valid url." });

      const checkUrl = await urlModel.findOne({longUrl : longUrl})
      if(checkUrl) return res.status(400).send({status : false, msg : "url already used"})

  const urlCode = shortid.generate(longUrl);
  const shortUrl = baseUrl + urlCode;

  const url = { longUrl: longUrl, urlCode: urlCode, shortUrl: shortUrl }; 

  const createUrlData= await urlModel.create(url)

  console.log(redirect(longUrl))

  return res.status(201).send({ status: true, data : createUrlData });
};
module.exports = { createUrl };
