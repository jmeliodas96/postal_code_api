const request = require("request-promise");
const cheerio = require("cheerio");
const MongoClient = require('mongodb').MongoClient;
const Express = require("express");
const BodyParser = require("body-parser");
const uri = "mongodb+srv://admin:"+ encodeURI("OHvxuRuPhIrwfQZ1") +"@cluster0.6nhzo.mongodb.net/" + encodeURI("postal_codes_nicaragua") + "?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const DATABASE_NAME = "postal_codes_nicaragua";
const PostalCodes = require('./postal_code_model');
var db;  
var assert = require('assert');  
var util=require('util');



var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection, bulk;


app.listen(5000, () => {
	client.connect( async (err, database) => {
		collection = client.db("postal_codes_nicaragua").collection("postal_codes_Nicaragua");
		bulk = collection.initializeUnorderedBulkOp();
		db = database;
		// $** allow search for all fields
		// "$**": "text",
    	const result = await collection.createIndex(
    		{  "$**": "text" },
    		// { weights: { Deparment: 80, Municipality: 80, Postal_code: 80, Neighbourhood: 80} },
    		{ default_language: "spanish" }
    	);

		// collection.createIndexes(
		// 	{
		// 		 Deparment: "text"
		// 	},
		// 	function(err, indexname) {
		// 		assert.equal(null, err);
		// 	}
		// );
		console.log("Connected to `" + result + "`!");
		// perform actions on the collection object
		// client.close();
	});
});

app.get("/insertPostalCodes", async (request, response) => {
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
});

app.post("/search", (request, response) => {
	
	// "$or": [ { "Deparment": request.query.param } ],
	const query = {
		"$text": {
	      	"$search": request.query.param
	    }  	
	};
	
	const projection = { "Deparment": 1};

	// var phrase = "\\\"" +  request.query.param + "\\\"";
	// collection.find({ searchkey: {$regex: request.query.param, $options: "$i"}})
	// collection.find(query)
	// .toArray(
	// 	function(err, result) {
	// 		if (err){
	// 			console.log("error > " , err);
	// 			return response.status(500).send(err);
	// 		} 
	// 		console.log("result > ", result);
	// 		response.send(result);
	// 	});
	// });

	collection.find(query).toArray(function(error, documents) {
	    if (error) throw error;

	    response.send(documents);
	});

});


async function getPostalCodesFromWeb() {
 	return await request.get("https://en.wikipedia.org/wiki/Postal_codes_in_Nicaragua");
}

