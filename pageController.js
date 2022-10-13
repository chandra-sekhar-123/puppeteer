const pageScraper = require('./pageScraper');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'Yellow';

async function scrapeAll(browserInstance){
	let browser;
	try{
		browser = await browserInstance;
		let scrapedData = {};
		// Call the scraper for different set of books to be scraped
		scrapedData['Insurance Agents'] = await pageScraper.scraper(browser, 'Insurance Agents');
		// scrapedData['Income Tax Offices'] = await pageScraper.scraper(browser, 'Income Tax Offices');
		// scrapedData['Investment Advisers'] = await pageScraper.scraper(browser, 'Investment Advisers');
		await browser.close();
       


		await client.connect();
        console.log('Connected successfully to server');
        const db = client.db(dbName);
        const collection = db.collection('yellowpages');

        

        const insertResult = await collection.insertMany([scrapedData]);
        console.log('Inserted documents =>', insertResult);
		console.log(scrapedData)
       
		fs.writeFile("data.json", JSON.stringify(scrapedData), 'utf8', function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("The data has been scraped and saved successfully! View it at './data.json'");
		});
	}
	catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}
}

module.exports = (browserInstance) => scrapeAll(browserInstance)