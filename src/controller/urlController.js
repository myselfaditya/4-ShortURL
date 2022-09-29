const urlModel = require("../model/urlModel");
const validUrl = require("valid-url");
const shortid = require("shortid");

const createUrl = async function (req, res) {
  try {
    const longUrl = req.body.longUrl;

    const baseUrl = "localhost:3000/";

    if (!longUrl)
      return res.status(400).send({ status: false, message: "please provide LongUrl." });


    if (!validUrl.isUri(longUrl))  //This is Package Method for URL Validation
      return res
        .status(400)
        .send({ status: false, message: "please provide valid LongUrl." });

    const checkUrl = await urlModel.findOne({ longUrl: longUrl })
    if (checkUrl) return res.status(400).send({ status: false, message: "LongUrl already used" })

    const urlCode = shortid.generate(longUrl);  //This is Package Method to generate ShortLink
    const shortUrl = baseUrl + urlCode;

    const url = { longUrl: longUrl, urlCode: urlCode, shortUrl: shortUrl };

    const createUrlData = await urlModel.create(url)

    return res.status(201).send({ status: true, data: createUrlData });
  }
  catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
};

//get url

const getUrl = async function (req, res) {
  try {
    const urlCode = req.params.urlCode
    if (!urlCode) return res.status(400).send({ status: false, message: 'Please provide UrlCode' })

    if (!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: 'Please provide valid UrlCode' })

    const checkUrlCode = await urlModel.findOne({ urlCode: urlCode })

    if (!checkUrlCode) return res.status(404).send({ status: false, message: 'UrlCode not found' })

    return res.status(302).redirect(checkUrlCode.longUrl)
  }
  catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }

}

module.exports = { createUrl, getUrl };
