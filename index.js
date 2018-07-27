const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 3000
const dotenv = require('dotenv').config();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const axios = require('axios');
const request = require('request-promise');
var cors = require('cors');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser')
//mandrill
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');
//firebase
var admin = require("firebase-admin");
//var serviceAccount = require("./key.json");

const app = express();
const shopifyApiPublicKey = process.env.SHOPIFY_API_PUBLIC_KEY;
const shopifyApiSecretKey = process.env.SHOPIFY_API_SECRET_KEY;
const scopes = 'write_products';
const appUrl = 'https://preorder-app.herokuapp.com/';

//body parser
app.use(bodyParser.urlencoded({ extended: false })) 

app.use(bodyParser.json());


//enable CORS 
app.use(cors())

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))


///////////// Helper Functions /////////////

const buildRedirectUri = () => `${appUrl}/shopify/callback`;

const buildInstallUrl = (shop, state, redirectUri) => `https://${shop}/admin/oauth/authorize?client_id=${shopifyApiPublicKey}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`;

const buildAccessTokenRequestUrl = (shop) => `https://${shop}/admin/oauth/access_token`;

const buildShopDataRequestUrl = (shop) => `https://${shop}/admin/shop.json`;

const generateEncryptedHash = (params) => crypto.createHmac('sha256', shopifyApiSecretKey).update(params).digest('hex');

const fetchAccessToken = async (shop, data) => await axios(buildAccessTokenRequestUrl(shop), {
  method: 'POST',
  data
});

const fetchShopData = async (shop, accessToken) => await axios(buildShopDataRequestUrl(shop), {
  method: 'GET',
  headers: {
    'X-Shopify-Access-Token': accessToken
  }
});



//functions to send mail through regular gmail in case Mandrill runs out of mail sends

function getReceiver(receiver,eta_product){
    
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


var mailOptions = {
  from: 'youremail@gmail.com',
  to: receiver,
  subject: 'Vessel Pre Order',
  text: eta_product
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
}

//mandrill function
function vesselMandrill(receiver,message){

 
var transport = nodemailer.createTransport(mandrillTransport({
  auth: {
    apiKey: process.env.MANDRILL_API
  }
}));
 
transport.sendMail({
  from: 'info@vesselbags.com',
  to: receiver,
  subject: 'Vessel Pre Order',
  html: message
}, function(err, info) {
  if (err) {
    console.error(err);
  } else {
    console.log(info);
  }
});
}


