// geometries and imports will appear above

// modify geometries

var pts = ee.FeatureCollection(ee.List([
  ee.Feature(pt1).set("Name","M1"),
  ee.Feature(pt2).set("Name","M2"),
  ee.Feature(pt3).set("Name","M3"),
  ee.Feature(pt4).set("Name","I1")]))
var ft = ee.FeatureCollection(ee.List([]))
///////////////////// functions //////////////////////////////

var tools = require('users/rudyschueder/default:DSD/SPMfunc')

// FILL - creates feature collection of values extracted from pts for each image in a collection
var Fill = function(img, ini) {
  // type cast
  var inift = ee.FeatureCollection(ini)
  // gets the values for the points in the current img
  // pts is 3 features in a feature collection, 
  // the features within ft2 will have the same properties as the features in pts
  var ft2 = img.reduceRegions(pts, ee.Reducer.first().setOutputs(ee.List(["SPM"])),10)
  // gets the date of the img
  var date = ee.String(img.get('system:index')).slice(0,8);
  // writes the date in each feature of the feature collections
  var ft3 = ft2.map(function(f){return f.set("date", date)})
  // merges the current time feature collection with the growing list of FeatureCollections (groups of 3)
  return inift.merge(ft3)
}

///////////////////// filter //////////////////////////////

var start_date = ee.Date('2016-01-01') 
var end_date = ee.Date('2018-01-01') 
var imgNo = ee.Number(3);

////////////////////// begin processing ///////////////////////

var collection = data
              .filterBounds(pt1)
              .filterBounds(pt2)
              .filterBounds(pt3)
              .filterBounds(pt4)
              //.filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1))
              .filterDate(start_date, end_date)
              .filterMetadata('CLOUDY_PIXEL_PERCENTAGE','less_than',10);

var trueC = collection.select(['B2','B3','B4','B5','B8']);               
var trueCImgs = trueC.toList(trueC.size());
print(trueCImgs)

// choose an image and visualize it
var cImg = ee.Image(trueCImgs.get(imgNo))
Map.addLayer(cImg, {'bands' :['B4','B3','B2'], min: [0,0,0], max: [2000,2000,2000]}, 'True color');
Map.addLayer(cImg, {'bands' :['B2','B4','B8'], min: [0,0,0], max: [2000,2000,2000]}, 'Çlear visual of SPM');

// compute spm, cast to feature collection that is to be printed to table
var spmCol = trueC.map(tools.ComputeSPM);

// iterate over every image, adding the fill function's returned value to the empty feature collection ft
// this is slower, iterate requires single computer computation rather than parallel computing
var newft = ee.FeatureCollection(spmCol.iterate(Fill,ft))
print(newft)

// Export table
Export.table.toDrive(newft,"mytask","GEE","pixel_extraction")

// plot the spm image from the collection
var spmImgs = spmCol.toList(spmCol.size(),0);
var spmImg = ee.Image(spmImgs.get(imgNo));
Map.addLayer(spmImg, {min: 0, max: 50, palette: '000000, 00FF00'}, 'spm concentration');
print(spmImg)

////////////////////// run task ////////////////////////////////

