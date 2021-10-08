const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const fs = require('fs-extra');
require('dotenv-safe').config();

const urlsFile = process.argv[2];
if (!urlsFile) {
    console.log("You must pass a urls file as the only argument");
    process.exit();
}

const urlFilesContent = `${fs.readFileSync(urlsFile)}`;
const urls = urlFilesContent.split(`\n`).filter(url => !url.startsWith("#")).map(url => url.trim(`\r`));

const sendEmail = async (url, res) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT),
        secure: true, // use TLS
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `"Ikea Scraper" <${process.env.MAIL_USER}>`, // sender address
        to: process.env.SEND_TO, // list of receivers
        subject: `Available ${res.counts.join(", ")}`, // Subject line
        html: `<a href="${url}">${url}</a>`,
    });
    
    console.log("Message sent: %s", info.messageId);
};

const check = async (url) => {
    const result = {};

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: 'networkidle2',
    });
    const html = await page.content(); 

    const $ = cheerio.load(html);
    const na = $('button.button.secondary.findProduct').length;
    const available = $('button.button.addToCart').length;

    if (na) {
        result.na = true;
    }
    if (available) {
        result.available = true;
        result.counts = [];
        $(`.count`).each(function() {
            result.counts.push($(this).text());            
        });
    }
  
    await browser.close();
    return result;
};

const run = async (url, interval) => {
    let res;
    try {
        res = await check(url);
    } catch (error) {
        console.log("Error reading URL");
        res = { na: true };
    }

    console.log(new Date(), res);

    if (res.na) {
        setTimeout(() => {
            run(url, interval);
        }, interval * 1000);
    } else {
        await sendEmail(url, res);    
    }
}

urls.forEach(url => {
    run(url, 60 * 30); // in seconds
});
