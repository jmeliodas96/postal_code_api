require('dotenv').config();
const request = require("request-promise");
const cheerio = require("cheerio");
const MongoClient = require('mongodb').MongoClient;
const Express = require("express");
const BodyParser = require("body-parser");
const uri = "mongodb+srv://admin:" + encodeURI(process.env.DB_PASS) +"@cluster0.6nhzo.mongodb.net/" + encodeURI(process.env.DB_COLLECTION_NAME) + "?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const DATABASE_NAME = process.env.DB_NAME;
var db;  
var assert = require('assert');  
var util=require('util');
var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection, bulk;


app.listen(5000, () => {
	client.connect( (err, database) => {
		collection = client.db("postal_codes_nicaragua").collection("postal_codes_Nicaragua");
		bulk = collection.initializeUnorderedBulkOp();
		db = database;
		// $** allow search for all fields
    	const result = collection.createIndex(
    		{  "$**": "text" },
    		{ default_language: "spanish" }
    	);
		console.log("Hii Nativo Software, you are connected to `" + DATABASE_NAME + "`!");
		// perform actions on the collection object
		// client.close();
	});
});

app.get("/insertPostalCodes", async (request, response) => {
	try {
		const postal_codes = await getPostalCodesFromWeb();
		const $ = cheerio.load(postal_codes);
		const scrapedData = [];
 
		$("#mw-content-text > div > table > tbody > tr").each( (index, element) => {
			if (index === 0) return true;
			const tds = $(element).find("td");
			const Deparment = $(tds[0]).text().replace(/\n/g, '');
			const Municipality = $(tds[1]).text().replace(/\n/g, '');
			const Postal_code = $(tds[2]).text().replace(/\n/g, '');
			const Neighbourhood = $(tds[3]).text().replace(/\n/g, '');
			// Build Object and insert collection
	        const tableRow = { Deparment, Municipality, Postal_code, Neighbourhood };
	    	scrapedData.push(tableRow);
		});
		
		collection.insert( scrapedData , (error, result) => {       
			console.log(error); 
			if(error) {
				return response.status(500).send(error);
			}
		    response.send(result.result);
		});
		
	} catch (error) {
		console.log(error);
	}
});

app.post("/search", (request, response) => {
	const query = {
		"$text": {
      		"$search": request.query.param
    	}  	
	};
	collection.find(query).toArray(function(error, documents) {
	    if (error) {
	    	console.log(error);
	    };
	    response.send(documents);
	});
});


async function getPostalCodesFromWeb() {
	try {
	 	return await request.get("https://en.wikipedia.org/wiki/Postal_codes_in_Nicaragua");
	} catch (error){
		console.log(error);
	}
}