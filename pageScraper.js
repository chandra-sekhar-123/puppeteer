const scraperObject = {
	url: 'http://yellowpages.in/categories',
	async scraper(browser, category) {
		let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		await page.goto(this.url);
		// Select the category of book to be displayed
		let selectedCategory = await page.$$eval('.categoriesListBlock > ul > li >  a', (links, _category) => {

			console.log(1, links)
			// Search for the element that has the matching text
			links = links.map(a => a.textContent.replace(/(\r\n\t|\n|\r|\t|^\s|\s$|\B\s|\s\B)/gm, "") === _category ? a : null);
			console.log(2, links)

			let link = links.filter(tx => tx !== null)[0];
			console.log(3, links)
			return link.href;
		}, category);
		// Navigate to the selected category
		await page.goto(selectedCategory);
		let scrapedData = [];
		// Wait for the required DOM to be rendered
		async function scrapeCurrentPage() {
			await page.waitForSelector('#MainContent_ulFList');
			// Get the link to all the required books
			let urls = await page.$$eval('li > div > div > .eachPopularTitleBlock', links => {
				// Make sure the book to be scraped is in stock

				// links = links.filter(link => link.querySelector('.eachPopularTagsList >li > a').textContent !== "Consultants")
				// console.links(1,links)
				// Extract the links from the data
				links = links.map(el => el.querySelector('div > a').href)
				console.log(links);
				return links;
			});
			// console.log(urls);

			// Loop through each of those links, open a new page instance and get the relevant data from them
			let pagePromise = (link) => new Promise(async (resolve, reject) => {
				let dataObj = {};
				let newPage = await browser.newPage();
				await newPage.goto(link);
				dataObj['CompanyTitle'] = await newPage.$eval('.businessTitle', text => text.textContent);
				dataObj['CompanyContact'] = await newPage.$eval('.businessContact > a', a => a.textContent);
				console.log(dataObj)
				// dataObj['loanAgents'] = await newPage.$eval('.eachPopularTagsList', text => {
				// 	// Strip new line and tab spaces
				// 	text = text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "");
				// 	// Get the number of stock available
				// 	let regexp = /^.*\((.*)\).*$/i;
				// 	let stockAvailable = regexp.exec(text)[1].split(' ')[0];
				// 	return stockAvailable;
				// });
				dataObj['imageUrl'] = await newPage.$eval('#MainContent_divImg > .bannerOtherImages > ul > li > a > img', img => img.src);
				// console.log(dataObj['imageUrl'])
				// dataObj['Adress'] = await newPage.$eval('#MainContent_divAdd > address', address => address.textContent);
				// dataObj['upc'] = await newPage.$eval('.table.table-striped > tbody > tr > td', table => table.textContent);
				resolve(dataObj);
				await newPage.close();
			});

			for (link in urls) {
				let currentPageData = await pagePromise(urls[link]);
				scrapedData.push(currentPageData);
				// console.log(currentPageData);
			}
			// When all the data on this page is done, click the next button and start the scraping of the next page
			// You are going to check if this button exist first, so you know if there really is a next page.
			let nextButtonExist = false;
			try {
				const nextButton = await page.$eval('.mobileLoadMore > button', button => button.textContent);
				nextButtonExist = true;
			}
			catch (err) {
				nextButtonExist = false;
			}
			if (nextButtonExist) {
				await page.click('.mobileLoadMore > button');
				return scrapeCurrentPage(); // Call this function recursively
			}
			await page.close();
			return scrapedData;
		}
		let data = await scrapeCurrentPage();
		console.log(data);
		return data;
	}
}

module.exports = scraperObject;