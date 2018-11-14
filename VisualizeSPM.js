// # BLOCK 1 #
// VisualizeSPM - exports SPM concentrations at specified points to table
// settings
var start_date = ee.Date('2016-01-01') 
var end_date = ee.Date('2018-01-01') 
var imgNo = ee.Number(3);
var pts = ee.FeatureCollection(ee.List([
          ee.Feature(pt1).set("Name","M1"),
          ee.Feature(pt2).set("Name","M2"),
          ee.Feature(pt3).set("Name","M3"),
          ee.Feature(pt4).set("Name","I1")]))
var ft = ee.FeatureCollection(ee.List([]))

///////////////////// functions //////////////////////////////

// fill - creates feature collection of values extracted from pts for each image in a collection
var fill = function(img, ini) {
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

// spm - computes spm concentrations from band reflectance
// use 665nm (S2 band B4), from Nechad et al. (2010) Table 4
var Ap = 355.85
var Bp = 1.74
var Cp = 0.1728
// SPM = (Ap * pw)/(1-pw/Cp) + Bp
var scal = 1/10000
var spm = function(img) {
  return img.expression(
  '(Ap * B4*(scal))/(1-(B4*(scal))/Cp) + Bp', {
  'B4': img.select('B4'),
  'Ap' : Ap,
  'Bp' : Bp,
  'Cp' : Cp,
  'scal' : scal});
  };

////////////////////// begin processing ///////////////////////

var collection = data
              .filterBounds(ee.Geometry(poly))
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
var spmCol = trueC.map(spm);
// iterate over every image, adding the fill function's returned value to the empty feature collection ft
// this is slower, iterate requires single computer computation rather than parallel computing
var newft = ee.FeatureCollection(spmCol.iterate(fill,ft))
print(newft)




// Export
Export.table.toDrive(newft,"anyDescription","GEE","pixel_extraction")

// plot the spm image from the collection
var spmImgs = spmCol.toList(spmCol.size(),0);
var spmImg = ee.Image(spmImgs.get(imgNo));
Map.addLayer(spmImg, {min: 0, max: 50, palette: '000000, 00FF00'}, 'spm concentration');
print(spmImg)

///////////////////////////////////////////////////////////////////////////////////////////////////////

// other method, slightly more complicated but faster

var test = ee.FeatureCollection(spmCol.toList(spmCol.size()).map(function(i) {
  // get some data at each point (replace with SPM and proper reducer for that)
  var SPM = ee.Image(i).select('constant').reduceRegions({
    collection: pts,
    reducer: ee.Reducer.first().setOutputs(ee.List(["SPM"])),
    scale: 10
  });
  // get date (format to your liking using ee.Date operators)
  // var date = ee.Image(i).date();  // gives you a date in EE date object
  var date = ee.Image(i).get('system:time_start');  // gives you a date in milliseconds since epoch
  return SPM.map(function(f) {
    return f.set('date', date);
  });
})).flatten();

print(test)
// charts in GEE:
// newft = newft.map(function(f) {
//   return f.set('SPM', ee.Number.parse(f.get('SPM')));
// });
// print(ui.Chart.feature.byProperty(newft, ['SPM']));