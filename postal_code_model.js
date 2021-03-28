const mongoose = require('mongoose');
const {Schema}  = mongoose;
mongoose.Promise = global.Promise;

const postalCodesSchema = new Schema({
	Deparment: String,
	Municipality: String,
	Postal_code: String,
	Neighbourhood: String,
});

postalCodesSchema.index({'$**': 'text'});
module.exports = mongoose.model('PostalCodes', postalCodesSchema);

// module.exports = {
// 	PostalCodes
// }

// {
//     Deparment: "text",
//     Municipality: "text",
//     Postal_code: "text",
//     Neighbourhood: "text"
// },
// {
//     weights: {
//     	content: 10,
//     	keywords: 5
//     },
//     name: "TextIndex"
// },