/* Instantiating the basic map */
var map = L.map('map').setView([36.558, -90.538], 9);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);
var marker = L.marker([36.558, -90.538]).addTo(map);
marker.bindPopup("This is the approximate location of the sites of <b>Turner</b> and <b>Snodgrass</b>, on which my dissertation focuses.").openPopup();

/* Instantiating the controls and constants needed to operate them */
let NDVIorPrecipInput = document.getElementById("NDVIorPrecipInput");
let dateInput = document.getElementById("dateInput");
let dateLabel = document.getElementById("dateLabel");
const rootPath = "https://joymersmann.github.io/geog456/finalproject/data/";
const startDate = new Date("2021-01-01");
const dateIncrConst = 1000*60*60*24;
var tiffHolder = L.layerGroup([]);

/* Update the map when the controls are interacted with */
function updateMap(){    
    /* calculating the new tiff to pull from (based on inputs) and how to display it */
    var path = rootPath;
    var colorscale = chroma.scale("greys");
    var date = startDate;
    var max = 1;

    if (NDVIorPrecipInput.checked) {
        // precip
        path = path + "precip/"
        colorscale = chroma.bezier(['ffffee', '7DFFFF', '19C8C8', '00227d']); 
        max = 10;
    } else {
        // NDVI
        path = path + "NDVI/"
        colorscale = chroma.bezier(['4b3200', 'f2ec76', '969600', '96c81e']);
        max = 10000; 
    }
    date = new Date(startDate.getTime() + dateIncrConst*dateInput.value);
    var dateYear = date.getUTCFullYear();
    var dateMonth = date.getUTCMonth()+1;
    if (dateMonth <= 9) {
        dateMonth = "0" + dateMonth;
    }
    var dateDay = date.getUTCDate();
    if (dateDay <= 9) {
        dateDay = "0" + dateDay;
    }
    path = path + dateYear + dateMonth + dateDay + ".tif";
    dateLabel.innerHTML = dateYear + "/" + dateMonth + "/" + dateDay;
    console.log("path is ", path);

    /* Generate and add the new tiffLayer*/ 
    fetch(path)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        parseGeoraster(arrayBuffer).then(georaster => {
            console.log("georaster:", georaster);

            for (var i = 0; i < georaster.mins.length; i++) {
                console.log("for iteration ", i,", min is: ", georaster.mins[i], ", max is: ", georaster.maxs[i])
            }
            /* generate the new tiffLayer*/
            let tiffLayer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.8,
                pixelValuesToColorFn: function(pixelValues) {
                    var pixelValue = pixelValues[0]; // there's just one band in this raster
                    if (pixelValue === -9999) return 'ffffff'; // if there's a lack of data, don't return a color

                    /* Scale the pixel values to 0 - 1 as used by chroma */
                    //var scaledPixelValue = (pixelValue - min) / (max - min);
                    var scaledPixelValue = pixelValue / max;
                    var color = colorscale(scaledPixelValue).hex();
                    return color;
                },
            });
            /* Remove any existing tiffs on the map */
            tiffHolder.eachLayer(function (layer) {
                map.removeLayer(layer);
            })
            tiffHolder.clearLayers();

            /* Add the new tiffLayer to the map*/
            tiffLayer.addTo(map);

            /* Add the tifflayer to the tiffHolder LayerGroup for easy removal on the next update */
            tiffHolder.addLayer(tiffLayer);
        });
    });



}
updateMap(); 
// to update the map on refresh