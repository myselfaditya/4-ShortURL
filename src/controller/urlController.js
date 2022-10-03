const urlModel = require("../model/urlModel");
const validUrl = require("valid-url");
const shortid = require("shortid");

const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  15432,
  "redis-15432.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("Jsq2dv5p4Vn1tUKz8DlwXWEK6sgWd5XE", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

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
    if (checkUrl) return res.status(400).send({ status: false, message: `LongUrl already used - ${checkUrl.urlCode}` })

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

    let cacheUrl = await GET_ASYNC(`${urlCode}`)// we are getting in string format
    let objCache= JSON.parse(cacheUrl)// converting into object format  

    
    if (objCache) {
      return res.status(302).redirect(objCache.longUrl) 
    }

    const checkUrlCode = await urlModel.findOne({ urlCode: urlCode })

    if (!checkUrlCode) return res.status(404).send({ status: false, message: 'UrlCode not found' })
    await SET_ASYNC(`${urlCode}`, JSON.stringify(checkUrlCode), 'PX', 6000)
    return res.status(302).redirect(checkUrlCode.longUrl)

  }
  catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }

}

module.exports = { createUrl, getUrl };
