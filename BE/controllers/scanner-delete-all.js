const ScannerModel = require('../models/scanner.model')
const SpotModel = require('../models/spot.model');
const MarginModel = require('../models/margin.model');

const a = ScannerModel.deleteMany({})
const b = MarginModel.deleteMany({})
const c = SpotModel.deleteMany({})

 Promise.allSettled([a, b, c]).then(result=>{
    console.log("delete all ok");
    
 })