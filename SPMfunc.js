///////////////////// functions //////////////////////////////

// FILL - creates feature collection of values extracted from pts for each image in a collection
exports.Fill = function(img, ini) {
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

// COMPUTESPM - computes spm concentrations from band reflectance
// use 665nm (S2 band B4), from Nechad et al. (2010) Table 4
var Ap = 355.85
var Bp = 1.74
var Cp = 0.1728
// SPM = (Ap * pw)/(1-pw/Cp) + Bp
var scal = 1/10000
exports.ComputeSPM = function(img) {
  return img.expression(
  '(Ap * B4*(scal))/(1-(B4*(scal))/Cp) + Bp', {
  'B4': img.select('B4'),
  'Ap' : Ap,
  'Bp' : Bp,
  'Cp' : Cp,
  'scal' : scal});
  };
