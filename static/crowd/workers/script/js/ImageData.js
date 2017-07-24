/**
 * Created by tvspina on 3/20/17.
 */
function ImageData() {
    this.img 			= null;
    this.label 			= null;
    this.grad           = null;
    this.texture 		= null;
    this.context_border = 0.0;

    this.__max_dimension = -1;
    this.xslices        = 16;
}


ImageData.prototype.createImageFromBuffer = function(arrayBuffer, xsize, ysize, zsize) {

    this.orig_xsize = xsize;
    this.orig_ysize = ysize;
    this.orig_zsize = zsize;

    // Reading image buffer as an iftImage
    var orig_img = new iftImage(xsize, ysize, zsize, new Uint8Array(arrayBuffer));

    var img = this.scaleImageFor3DVisualization(orig_img, false);


    if(!iftIsPowerOf2(img.xsize) || !iftIsPowerOf2(img.ysize) || !iftIsPowerOf2(img.zsize)) {
        iftError("Image dimensions are not power of 2", "loadImageFile");
        console.log(imgInfo);
        return;
    }

    this.img 	= img;
    this.label 	= iftCreateImage(img.xsize, img.ysize, img.zsize);

    this.setTexture(this.img);

    var xfactor, yfactor, zfactor;
    var maxDimension = this.getMaxDimension(this.texture);

    // Dividing by the actual size to make sure that we have "round" number
    xfactor = (this.texture.xsize) / (maxDimension + 1);
    yfactor = (this.texture.ysize) / (maxDimension + 1);
    zfactor = (this.texture.zsize) / (maxDimension + 1);

    this.bb_world = new iftBoundingBox(new THREE.Vector3(-xfactor / 2.0, -yfactor / 2.0, -zfactor / 2.0),
        new THREE.Vector3(xfactor / 2.0,  yfactor / 2.0,  zfactor / 2.0));

    this.__max_dimension = this.getMaxDimension(this.img);
    this.__box_dimensions = [xfactor, yfactor, zfactor];
};

ImageData.prototype.setTexture = function(img) {
// Computing a mosaic from the image to compute an image texture
    var mosaic = iftSceneToSliceMosaic(img, this.xslices);

    var bytes = iftAllocUCharArray(mosaic.n);

    for (var p = 0; p < mosaic.n; p++) {
        bytes[p] = mosaic.val[p];
    }
    this.texture = new THREE.DataTexture(bytes, mosaic.xsize,
                            mosaic.ysize, THREE.LuminanceFormat, THREE.UnsignedByteType,
                            THREE.UVMapping, THREE.ClampToEdgeWrapping,
                            THREE.ClampToEdgeWrapping);

    this.texture.generateMipmaps = false;
    this.texture.minFilter 	= THREE.LinearFilter;
    this.texture.magFilter 	= THREE.LinearFilter;
    this.texture.xsize 		= img.xsize;
    this.texture.ysize 		= img.ysize;
    // The depth of the texture should consider the extra Z slices that were added when mosaicing the image
    this.texture.zsize 		= Math.ceil(img.zsize / this.xslices) * this.xslices;
    this.texture.xslices	= this.xslices;


    // Flipping Y coordinates to match the world's orientation
    this.texture.flipY 			= true;
    this.texture.needsUpdate	= true;
};

ImageData.prototype.scaleImageFor3DVisualization = function (orig_img, nearest_neighbors) {
    var xsize_power2 = iftMin(MAXIMUM_3D_TEXTURE_SIZE, iftNextPowerOf2(orig_img.xsize));
    var ysize_power2 = iftMin(MAXIMUM_3D_TEXTURE_SIZE, iftNextPowerOf2(orig_img.ysize));
    var zsize_power2 = iftMin(MAXIMUM_3D_TEXTURE_SIZE, iftNextPowerOf2(orig_img.zsize));
    var img = orig_img;

    if(xsize_power2 !== img.xsize || ysize_power2 !== img.ysize || zsize_power2 !== img.zsize) {
        if(nearest_neighbors  !== undefined && nearest_neighbors) {
            img = iftScaleImageByNearestNeighbor(orig_img, xsize_power2 / orig_img.xsize, ysize_power2 / orig_img.ysize, zsize_power2 / orig_img.zsize);
        } else {
            // img = iftScaleImage(orig_img, xsize_power2 / orig_img.xsize, ysize_power2 / orig_img.ysize, zsize_power2 / orig_img.zsize);
            img = iftResizeImage(orig_img, xsize_power2, ysize_power2, zsize_power2);
        }
    }

    if(xsize_power2 !== img.xsize || ysize_power2 !== img.ysize || zsize_power2 !== img.zsize)
        iftError("Image interpolation failed to resize image for 3D visualization size", "scaleImageFor3DVisualization");

    return img;
};

// ImageData.prototype.scaleImageFor3DVisualization = function (orig_img, nearest_neighbors) {
//     var xsize_power2 = iftNextPowerOf2(orig_img.xsize);
//     var ysize_power2 = iftNextPowerOf2(orig_img.ysize);
//     var zsize_power2 = iftNextPowerOf2(orig_img.zsize);
//     var img = orig_img;
//
//     img = iftAddRectangularBoxFrame(orig_img, (xsize_power2 - orig_img.xsize) / 2, (ysize_power2 - orig_img.ysize) / 2,
//                                     (zsize_power2 - orig_img.zsize) / 2, 0);
//
//     console.log('img size ', img);
//
//     return img;
// };


ImageData.prototype.scaleImageToOriginalSize = function (img, nearest_neighbors) {
    var orig_img = img;

    if(this.orig_xsize !== img.xsize || this.orig_ysize !== img.ysize || this.orig_zsize !== img.zsize) {
        if(nearest_neighbors  !== undefined && nearest_neighbors) {
            orig_img = iftScaleImageByNearestNeighbor(img, this.orig_xsize / img.xsize, this.orig_ysize / img.ysize, this.orig_zsize / img.zsize);
        } else {
            // orig_img = iftScaleImage(img, this.orig_xsize / img.xsize, this.orig_ysize / img.ysize, this.orig_zsize / img.zsize);
            orig_img = iftResizeImage(img, this.orig_xsize, this.orig_ysize, this.orig_zsize);
        }
    }

    if(this.orig_xsize !== orig_img.xsize || this.orig_ysize !== orig_img.ysize || this.orig_zsize !== orig_img.zsize) {
        console.log('Orig size', this.orig_xsize, this.orig_ysize, this.orig_zsize, 'to', orig_img.xsize, orig_img.ysize, orig_img.zsize);
        iftError("Image interpolation failed to resize image to original size", "scaleImageToOriginalSize");
    }

    return orig_img;
};


// ImageData.prototype.scaleImageToOriginalSize = function (img, nearest_neighbors) {
//     var orig_img = img;
//
//     orig_img = iftRemRectangularBoxFrame(img, this.orig_xsize - img.xsize, this.orig_ysize - img.ysize,
//                                         this.orig_zsize - img.zsize);
//
//     return img;
// };

// IMPORTANT: the label is assumed to have the sabe size of the original image
ImageData.prototype.loadLabel = function (arrayBuffer) {
    var orig_label = new iftImage(this.orig_xsize, this.orig_ysize, this.orig_zsize, new Uint8Array(arrayBuffer));

    this.label = this.scaleImageFor3DVisualization(orig_label, true);
};


ImageData.prototype.loadGrad = function(arrayBuffer) {
    var orig_grad = new iftImage(this.orig_xsize, this.orig_ysize, this.orig_zsize, new Uint8Array(arrayBuffer));

    console.log('Loading grad', orig_grad);

    this.grad = this.scaleImageFor3DVisualization(orig_grad, true);
};


ImageData.prototype.getLabelInOriginalSize = function() {
    return this.scaleImageToOriginalSize(this.label, true);
};

ImageData.prototype.clearSegmentationData = function() {
    if(this.label !== null) {
        iftSetImage(this.label, 0);
    }
};

ImageData.prototype.getMaxDimension = function(img) {

    return Math.max(img.xsize - 1.0, img.ysize - 1.0, img.zsize - 1.0);
};

ImageData.prototype.getBoxDimensions = function() {

    return this.__box_dimensions;
};

ImageData.prototype.getBoxDiagonalSize = function() {
    return Math.sqrt(this.__box_dimensions[0]*this.__box_dimensions[0] + this.__box_dimensions[1]*this.__box_dimensions[1]
                        + this.__box_dimensions[2]*this.__box_dimensions[2]);
};

ImageData.prototype.getBoxCenter = function() {
    return new THREE.Vector3(this.__box_dimensions[0] / 2, this.__box_dimensions[1] / 2, this.__box_dimensions[2] / 2);
};

ImageData.prototype.getVoxelWorldSize = function(img) {
    return 1.0 / this.__max_dimension;
};

ImageData.prototype.worldDimensionToImageDimension = function(value) {
    return value * this.__max_dimension;
};

ImageData.prototype.imageDimensionToWorldDimension = function(value) {
    return value / this.__max_dimension;
};

// Converts the set of points into image coordinates
ImageData.prototype.worldCoordsToImageCoords = function(world_coords, center) {
    var v = world_coords.clone();
    v.y *= -1; // Inverting the y coordinate to match the image's coordinate system

    return v.add(center).multiplyScalar(this.__max_dimension).round();
};

ImageData.prototype.imageCoordsToWorldCoords = function(coords, center_float) {
    return new THREE.Vector3((coords.x - center_float.x) / this.__max_dimension, (center_float.y - coords.y) / this.__max_dimension,
        (coords.z - center_float.z) / this.__max_dimension );
};

ImageData.prototype.setTileContextBorder = function (context_border_rel) {
    // Since the loaded image already contains the border, we set the work border relative to the expanded size, instead
    // of the original one, for display
    this.context_border = 0.5 - (0.5) / (1.0 + 2*context_border_rel);
};

ImageData.prototype.getTileContextBorder = function () {
    return this.context_border;
};

function getImageCenterFloat(img) {
    // IMPORTANT: the chosen image center is float (it mght be between to voxels)
    return new THREE.Vector3((img.xsize - 1) / 2, (img.ysize - 1) / 2, (img.zsize - 1) / 2);
}