/* Instantiating the basic map */
var map = L.map('map').setView([36.558, -90.538], 9);

/* Setting up for TiffLayer creation */
let path = "https://joymersmann.github.io/geog456/finalproject/data/NDVI/20210101.tif"; 
var colorscale = chroma.scale("greys");
var tiffHolder = L.layerGroup([]);

function updateTiff() {
    fetch(path)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        parseGeoraster(arrayBuffer).then(georaster => {
            /* Acquiring the min and max values in the georaster*/
            var min = georaster.mins[0];
            var max = georaster.maxs[0];

            /* Generate the new tiffLayer*/
            let tiffLayer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.8,
                pixelValuesToColorFn: function(pixelValues) {
                    var pixelValue = pixelValues[0]; // Using the first band of the raster
                    if (pixelValue === -9999) return 'ffffff'; // if there's a lack of data, don't return a color
                    var scaledPixelValue = (pixelValue - min) / (max - min); //Scale the pixel values to 0 - 1 as used by chroma
                    var color = colorscale(scaledPixelValue).hex(); // Get the color
                    return color; // Return the color
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