/**
 * Created by tvspina on 1/17/17.
 */

function iftBoundingBox(begin, end) {
    this.begin  = begin.clone();
    this.end    = end.clone();
}

function iftGetVoxelCoord(img, p)
{
    var u = new THREE.Vector3(0,0,0);

    u.x = Math.floor(Math.floor((p) % ((img.xsize)*(img.ysize))) % img.xsize);
    u.y = Math.floor(Math.floor((p) % ((img.xsize) * (img.ysize))) / img.xsize);
    u.z = Math.floor((p) / ((img.xsize)*(img.ysize)));

    return(u);
}

function iftGetVoxelIndex(img, v) {
    return ((v.x)+img.xsize*(v.y)+img.xsize*img.ysize*(v.z));
}

function iftValidVoxel(img, v)  {
    return ((v.x >= 0) && (v.x < img.xsize) && (v.y >= 0) && (v.y < img.ysize) && (v.z >= 0) && (v.z < img.zsize));
}

function iftImage(xsize, ysize, zsize, val) {
    this.n = xsize * ysize * zsize;
    this.val = iftAllocIntArray(this.n);
    this.Cb = null;
    this.Cr = null;
    this.xsize = xsize;
    this.ysize = ysize;
    this.zsize = zsize;
    this.dx = 1.0;
    this.dy = 1.0;
    this.dz = 1.0;

    if (val === null) {
        this.val = iftAllocIntArray(xsize * ysize * zsize);
    } else {
        // Copying values since javascript works by value, not reference
        for (var p = 0; p < this.n; p++) {
            this.val[p] = val[p];
        }
    }
}

function iftCreateImage(xsize,ysize,zsize) {
    return new iftImage(xsize, ysize, zsize, null);
}

function iftCopyVoxelSize(src, dst) {
    dst.x = src.x;
    dst.y = src.y;
    dst.z = src.z;
}

function iftSetImage(img, value) {
    for (var p = 0; p < img.n; p++)
        img.val[p] = value;
}

function iftSetCbCr(img, value)
{
    var p;

    if (!iftIsColorImage(img)){
        img.Cb = iftAllocUShortArray(img.n);
        img.Cr = iftAllocUShortArray(img.n);
    }
    for (p=0; p < img.n; p++) {
        img.Cb[p] = value;
        img.Cr[p] = value;
    }
}

function iftSetCb(img, value)
{
    var p;

    if (img.Cb === null){
        img.Cb = iftAllocUShortArray(img.n);
        for (p=0; p < img.n; p++) {
            img.Cb[p] = value;
        }
    }
}

function iftSetCr(img, value)
{
    var p;

    if (img.Cr === null){
        img.Cr = iftAllocUShortArray(img.n);
        for (p=0; p < img.n; p++) {
            img.Cr[p] = value;
        }
    }
}

function iftCopyImage(img)
{
    var imgc = iftCreateImage(img.xsize,img.ysize,img.zsize);

    iftCopyImageInplace(img, imgc);

    return (imgc);
}

function iftCopyImageInplace(src, dest) {

    iftCopyVoxelSize(src, dest);

    for (var p=0; p < src.n; p++)
        dest.val[p] = src.val[p];

    if (src.Cb !== null) {
        if(dest.Cb === null)
            dest.Cb = iftAllocUShortArray(src.n);
        if(dest.Cr === null)
            dest.Cr = iftAllocUShortArray(src.n);
        for (var p = 0; p < src.n; p++) {
            dest.Cb[p] = src.Cb[p];
            dest.Cr[p] = src.Cr[p];
        }
    }
}

function iftIsColorImage(img) {
    return (img.Cb !== null && img.Cr !== null);
}


function iftCopyCbCr(src, dst) {
    if (iftIsColorImage(src)) {
        if (!iftIsDomainEqual(src, dst))
            iftError("Images must have the same domain","iftCopyCbCr");

        if (dst.Cb === null){
            dst.Cb = iftAllocUShortArray(dst.n);
            dst.Cr = iftAllocUShortArray(dst.n);
        }

        for (var p = 0; p < dst.n; p++) {
            dst.Cb[p] = src.Cb[p];
            dst.Cr[p] = src.Cr[p];
        }
    }
}


function iftIs3DImage(img)
{
    return (img.zsize > 1);
}



function iftMaximumValueInRegion(img, bb) {
    var img_max_val = IFT_INFINITY_INT_NEG;

    var v = new THREE.Vector3(0,0,0);

    for (v.z = bb.begin.z; v.z <= bb.end.z; v.z++) {
        for (v.y = bb.begin.y; v.y <= bb.end.y; v.y++) {
            for (v.x = bb.begin.x; v.x <= bb.end.x; v.x++) {
                var p = iftGetVoxelIndex(img, v);
                if (img_max_val < img.val[p]) {
                    img_max_val = img.val[p];
                }
            }
        }
    }

    return img_max_val;
}

function iftMaximumValue(img) {

    var bb = new iftBoundingBox(new THREE.Vector3(0,0,0), new THREE.Vector3(img.xsize - 1, img.ysize - 1, img.zsize - 1));

    return iftMaximumValueInRegion(img, bb);
}

function iftMinimumValueInRegion(img, bb) {
    var img_min_val = IFT_INFINITY_INT;

    var v = new THREE.Vector3(0,0,0);

    for (v.z = bb.begin.z; v.z <= bb.end.z; v.z++) {
        for (v.y = bb.begin.y; v.y <= bb.end.y; v.y++) {
            for (v.x = bb.begin.x; v.x <= bb.end.x; v.x++) {
                var p = iftGetVoxelIndex(img, v);
                if (img_min_val > img.val[p]) {
                    img_min_val = img.val[p];
                }
            }
        }
    }

    return img_min_val;
}

function iftMinimumValue(img) {

    var bb = new iftBoundingBox(new THREE.Vector3(0,0,0), new THREE.Vector3(img.xsize - 1, img.ysize - 1, img.zsize - 1));

    return iftMinimumValueInRegion(img, bb);
}


function iftMinBoundingBox(img) {

    var n = 0; // number of spels non-background (non-zero)
    var gc = new THREE.Vector3(0.0, 0.0, 0.0);
    var mbb = new iftBoundingBox(new THREE.Vector3(IFT_INFINITY_INT, IFT_INFINITY_INT, IFT_INFINITY_INT),
                                    new THREE.Vector3(IFT_INFINITY_INT_NEG, IFT_INFINITY_INT_NEG, IFT_INFINITY_INT_NEG));

    for (var p = 0; p < img.n; p++) {
        if (img.val[p] !== 0) {
            var v = iftGetVoxelCoord(img, p);

            mbb.begin.x = Math.min(mbb.begin.x, v.x);
            mbb.begin.y = Math.min(mbb.begin.y, v.y);
            mbb.begin.z = Math.min(mbb.begin.z, v.z);

            mbb.end.x = Math.max(mbb.end.x, v.x);
            mbb.end.y = Math.max(mbb.end.y, v.y);
            mbb.end.z = Math.max(mbb.end.z, v.z);

            gc.x += v.x;
            gc.y += v.y;
            gc.z += v.z;
            n++;
        }
    }

    if (iftAlmostZero(mbb.begin.x - IFT_INFINITY_INT)) {
        mbb.begin.x = mbb.begin.y = mbb.begin.z = -1;
        mbb.end.x   = mbb.end.y   = mbb.end.z   = -1;
        gc.x        = gc.y        = gc.z        = -1.0;
    } else {
        gc.x /= n;
        gc.y /= n;
        gc.z /= n;
    }

    return [mbb, gc];
}


function iftGeometricCenter(obj)
{
    var u = new THREE.Vector3(0, 0, 0);
    var c = new THREE.Vector3(0, 0, 0);
    var n = 0;

    c.x = c.y = c.z = 0.0;
    for (u.z=0; u.z < obj.zsize; u.z++)
        for (u.y=0; u.y < obj.ysize; u.y++)
            for (u.x=0; u.x < obj.xsize; u.x++) {
                var p = iftGetVoxelIndex(obj,u);
                if (obj.val[p]!==0){
                    c.x += u.x;
                    c.y += u.y;
                    c.z += u.z;
                    n++;
                }
            }

    if(n == 0)
        return null;

    c.x /= n;
    c.y /= n;
    c.z /= n;

    return(c);
}

/**************************************************/
function iftGetXYSlice(img, zcoord)
{
    var slice = null;
    var u = new THREE.Vector3();
    var p,q;

    if ( (zcoord < 0) || (zcoord >= img.zsize))
        iftError("Invalid z coordinate","iftGetXYSlice");

    if(iftIsColorImage(img))
        slice = iftCreateColorImage(img.xsize,img.ysize,1);
    else
        slice = iftCreateImage(img.xsize,img.ysize,1);

    u.z   = zcoord;
    q     = 0;
    for (u.y = 0; u.y < img.ysize; u.y++)
        for (u.x = 0; u.x < img.xsize; u.x++)
        {
            p = iftGetVoxelIndex(img,u);
            slice.val[q] = img.val[p];
            if(iftIsColorImage(img))
            {
                slice.Cb[q] = img.Cb[p];
                slice.Cr[q] = img.Cr[p];
            }
            q++;
        }
    iftCopyVoxelSize(img,slice);

    return(slice);
}

function iftPutXYSlice(img, slice, zcoord)
{
    var u = new THREE.Vector3();
    var p,q;

    if ( (zcoord < 0) || (zcoord >= img.zsize))
        iftError("Invalid z coordinate","iftPutXYSlice");

    if ( (img.ysize!==slice.ysize)||(img.xsize!==slice.xsize) )
        iftError("Image and slice are incompatibles","iftPutXYSlice");

    u.z   = zcoord;
    p     = 0;
    for (u.y = 0; u.y < img.ysize; u.y++)
        for (u.x = 0; u.x < img.xsize; u.x++)
        {
            q = iftGetVoxelIndex(img,u);
            img.val[q] = slice.val[p];
            if(iftIsColorImage(img))
            {
                img.Cb[q] = slice.Cb[p];
                img.Cr[q] = slice.Cr[p];
            }
            p++;
        }
}

function iftGetZXSlice(img, ycoord)
{
    var slice = null;
    var u = new THREE.Vector3();
    var p,q;

    if ( (ycoord < 0) || (ycoord >= img.ysize))
        iftError("Invalid y coordinate","iftGetZXSlice");

    if(iftIsColorImage(img))
        slice = iftCreateColorImage(img.zsize,img.xsize,1);
    else
        slice = iftCreateImage(img.zsize,img.xsize,1);

    u.y   = ycoord;
    q = 0;
    for (u.x = 0; u.x < img.xsize; u.x++)
        for (u.z = 0; u.z < img.zsize; u.z++)
        {
            p = iftGetVoxelIndex(img,u);
            slice.val[q] = img.val[p];
            if(iftIsColorImage(img))
            {
                slice.Cb[q] = img.Cb[p];
                slice.Cr[q] = img.Cr[p];
            }
            q++;
        }
    iftCopyVoxelSize(img,slice);

    return(slice);
}

function iftPutZXSlice(img, slice, ycoord)
{
    var u = new THREE.Vector3();
    var p,q;

    if ( (ycoord < 0) || (ycoord >= img.ysize))
        iftError("Invalid y coordinate","iftPutZXSlice");

    if ( (img.xsize!==slice.ysize)||(img.zsize!==slice.xsize) )
        iftError("Image and slice are incompatibles","iftPutZXSlice");

    u.y   = ycoord;
    p     = 0;
    for (u.x = 0; u.x < img.xsize; u.x++)
        for (u.z = 0; u.z < img.zsize; u.z++)
        {
            q = iftGetVoxelIndex(img,u);
            img.val[q] = slice.val[p];
            if(iftIsColorImage(img))
            {
                img.Cb[q] = slice.Cb[p];
                img.Cr[q] = slice.Cr[p];
            }
            p++;
        }
}

function iftGetYZSlice(img, xcoord)
{
    var slice = null;
    var u = new THREE.Vector3();
    var p,q;

    if ( (xcoord < 0) || (xcoord >= img.xsize))
        iftError("Invalid x coordinate","iftGetYZSlice");

    if(iftIsColorImage(img))
        slice = iftCreateColorImage(img.ysize,img.zsize,1);
    else
        slice = iftCreateImage(img.ysize,img.zsize,1);

    u.x   = xcoord;
    q     = 0;
    for (u.z = 0; u.z < img.zsize; u.z++)
        for (u.y = 0; u.y < img.ysize; u.y++)
        {
            p = iftGetVoxelIndex(img,u);
            slice.val[q] = img.val[p];
            if(iftIsColorImage(img))
            {
                slice.Cb[q] = img.Cb[p];
                slice.Cr[q] = img.Cr[p];
            }
            q++;
        }
    iftCopyVoxelSize(img,slice);

    return(slice);
}

function iftPutYZSlice(img, slice, xcoord)
{
    var u = new THREE.Vector3();
    var p,q;

    if ( (xcoord < 0) || (xcoord >= img.xsize))
        iftError("Invalid x coordinate","iftPutYZSlice");

    if ( (img.zsize!==slice.ysize)||(img.ysize!==slice.xsize) )
        iftError("Image and slice are incompatibles","iftPutYZSlice");

    u.x   = xcoord;
    p     = 0;
    for (u.z = 0; u.z < img.zsize; u.z++)
        for (u.y = 0; u.y < img.ysize; u.y++)
        {
            q = iftGetVoxelIndex(img,u);
            img.val[q] = slice.val[p];
            if(iftIsColorImage(img))
            {
                img.Cb[q] = slice.Cb[p];
                img.Cr[q] = slice.Cr[p];
            }
            p++;
        }
}

function iftInsertROIByPosition(roi, roi_pos, target, target_pos) {
    var uo = new THREE.Vector3(), uf = new THREE.Vector3();

    if (roi === null)
        iftError("ROI Image is null", "iftInsertROIByPosition");
    if (target === null)
        iftError("Source Image is null", "iftInsertROIByPosition");

    // Computing the first valid position in the target image that intersects the ROI
    uo.x = iftMax(0, target_pos.x - roi_pos.x);
    uo.y = iftMax(0, target_pos.y - roi_pos.y);
    uo.z = iftMax(0, target_pos.z - roi_pos.z);

    // Computing the last valid position in the target image that intersects the ROI
    uf.x = iftMin(target.xsize - 1, uo.x + roi.xsize - 1);
    uf.y = iftMin(target.ysize - 1, uo.y + roi.ysize - 1);
    uf.z = iftMin(target.zsize - 1, uo.z + roi.zsize - 1);

    if (iftIsColorImage(target)) {
        var u = new THREE.Vector3();

        // Iterating over the target image and copying the values from the ROI
        for (u.z = uo.z; u.z <= uf.z; u.z++)
            for (u.y = uo.y; u.y <= uf.y; u.y++)
                for (u.x = uo.x; u.x <= uf.x; u.x++) {
                    var v = new THREE.Vector3();

                    // NOTE: this is almost the same as subtracting from uo
                    v.x = (u.x - target_pos.x) + roi_pos.x;
                    v.y = (u.y - target_pos.y) + roi_pos.y;
                    v.z = (u.z - target_pos.z) + roi_pos.z;

                    var p = iftGetVoxelIndex(target, u);
                    var q = iftGetVoxelIndex(roi, v);

                    target.val[p] = roi.val[q];
                    target.Cb[p]  = roi.Cb[q];
                    target.Cr[p]  = roi.Cr[q];
                }
    } else {
        var u = new THREE.Vector3();

        // Iterating over the target image and copying the values from the ROI
        for (u.z = uo.z; u.z <= uf.z; u.z++)
            for (u.y = uo.y; u.y <= uf.y; u.y++)
                for (u.x = uo.x; u.x <= uf.x; u.x++) {
                    var v = new THREE.Vector3();

                    v.x = (u.x - target_pos.x) + roi_pos.x;
                    v.y = (u.y - target_pos.y) + roi_pos.y;
                    v.z = (u.z - target_pos.z) + roi_pos.z;

                    var p       = iftGetVoxelIndex(target, u);
                    var q       = iftGetVoxelIndex(roi, v);

                    target.val[p] = roi.val[q];
                }
    }
}

function iftSceneToSliceMosaic(img, xslices) {
    var mosaic = null;

    if(!iftIs3DImage(img))
        iftError("Mosaicing 3D image slices only supports 3D images", "iftSceneToSliceMosaic");

    xslices = iftMax(1, iftMin(xslices, img.zsize));
    mosaic  = iftCreateImage(img.xsize*xslices, img.ysize*(Math.ceil(img.zsize/xslices)), 1);

    iftSceneToSliceMosaicInplace(img, xslices, mosaic);

    return mosaic;
}

function iftSceneToSliceMosaicInplace(img, xslices, mosaic) {
    if(!iftIs3DImage(img))
        iftError("Mosaicing 3D image slices only supports 3D images", "iftSceneToSliceMosaicInplace");

    var xsize_expec = img.xsize*xslices;
    var ysize_expec = img.ysize*(Math.ceil(img.zsize/xslices));

    if(!iftAlmostZero(xsize_expec - mosaic.xsize) || !iftAlmostZero(ysize_expec - mosaic.ysize) || iftIs3DImage(mosaic)) {
        iftError("Input 3D image dimensions do not match with the expected values for the input 2D mosaic image",
            "iftSceneToSliceMosaicInplace");
        console.log('xsize_expec: ' + xsize_expec + 'ysize_expec ' + ysize_expec + 'mosaic size ' + mosaic.xsize + ' ' + mosaic.ysize);

        return null;
    }

    for(var z = 0; z < img.zsize; z++) {
        var orig = new THREE.Vector3(), target = new THREE.Vector3();
        var u, v;

        orig.x      = orig.y = orig.z = 0;
        target.x    = img.xsize*(iftSafeMod(z, xslices));
        target.y    = img.ysize*(Math.floor(z / xslices));
        target.z    = 0;

        u = new THREE.Vector3(0, 0, z);
        v = new THREE.Vector3(0, 0, 0);

        for(u.y = 0; u.y < img.ysize; u.y++) {
            for (u.x = 0; u.x < img.xsize; u.x++) {
                var p, q;
                v.x = u.x + target.x;
                v.y = u.y + target.y;

                p = iftGetVoxelIndex(img, u);
                q = iftGetVoxelIndex(mosaic, v);

                mosaic.val[q] = img.val[p];
            }
        }
    }
}

function iftAddFrame(img, sz, value)
{
    return iftAddRectangularBoxFrame(img, sz, sz, sz, value);
}

function iftAddRectangularBoxFrame(img, sx, sy, sz, value)
{
    var fimg;
    var p, q;
    var u = new THREE.Vector3();

    if (iftIs3DImage(img)) {
        fimg = iftCreateImage(img.xsize+(2*sx),img.ysize+(2*sy), img.zsize+(2*sz));
        iftCopyVoxelSize(img,fimg);
        iftSetImage(fimg,value);

        // Videos are 3D color images
        if(iftIsColorImage(img)) {
            iftSetCbCr(fimg,128);
            p = 0;
            for (u.z=sz; u.z < fimg.zsize-sz; u.z++)
                for (u.y=sy; u.y < fimg.ysize-sy; u.y++)
                    for (u.x=sx; u.x < fimg.xsize-sx; u.x++) {
                        q = iftGetVoxelIndex(fimg,u);
                        fimg.val[q] = img.val[p];
                        fimg.val[q] = img.Cb[p];
                        fimg.val[q] = img.Cr[p];
                        p++;
                    }
        } else {
            p = 0;
            for (u.z=sz; u.z < fimg.zsize-sz; u.z++)
                for (u.y=sy; u.y < fimg.ysize-sy; u.y++)
                    for (u.x=sx; u.x < fimg.xsize-sx; u.x++) {
                        q = iftGetVoxelIndex(fimg,u);
                        fimg.val[q] = img.val[p];
                        p++;
                    }
        }
    } else {
        fimg = iftCreateImage(img.xsize+(2*sx),img.ysize+(2*sy), 1);
        iftSetImage(fimg,value);

        if (iftIsColorImage(img)){
            iftSetCbCr(fimg,128);
            p = 0; u.z = 0;
            for (u.y=sy; u.y < fimg.ysize-sy; u.y++)
                for (u.x=sx; u.x < fimg.xsize-sx; u.x++) {
                    q = iftGetVoxelIndex(fimg,u);
                    fimg.val[q] = img.val[p];
                    fimg.val[q] = img.Cb[p];
                    fimg.val[q] = img.Cr[p];
                    p++;
                }
        }else{
            p = 0; u.z = 0;
            for (u.y=sy; u.y < fimg.ysize-sy; u.y++)
                for (u.x=sx; u.x < fimg.xsize-sx; u.x++) {
                    q = iftGetVoxelIndex(fimg,u);
                    fimg.val[q] = img.val[p];
                    p++;
                }
        }
    }

    return(fimg);
}

function iftRemFrame(fimg, sz) {
    return iftRemRectangularBoxFrame(fimg, sz, sz, sz);
}

function iftRemRectangularBoxFrame(fimg, sx, sy, sz) {
    var img;
    var p, q;
    var u = new THREE.Vector3();

    if (iftIs3DImage(fimg)) {
        img = iftCreateImage(fimg.xsize-(2*sx),fimg.ysize-(2*sy),fimg.zsize-(2*sz));
        iftCopyVoxelSize(fimg,img);

        // A video is a 3D color image
        if(iftIsColorImage(fimg)) {
            iftSetCbCr(img,128);
            p = 0;
            for (u.z=sz; u.z < fimg.zsize-sz; u.z++)
                for (u.y=sy; u.y < fimg.ysize-sy; u.y++)
                    for (u.x=sx; u.x < fimg.xsize-sx; u.x++) {
                        q = iftGetVoxelIndex(fimg,u);
                        img.val[p] = fimg.val[q];
                        img.Cb[p] = fimg.Cb[q];
                        img.Cr[p] = fimg.Cr[q];
                        p++;
                    }
        } else {
            p = 0;
            for (u.z=sz; u.z < fimg.zsize-sz; u.z++)
                for (u.y=sy; u.y < fimg.ysize-sy; u.y++)
                    for (u.x=sx; u.x < fimg.xsize-sx; u.x++) {
                        q = iftGetVoxelIndex(fimg,u);
                        img.val[p] = fimg.val[q];
                        p++;
                    }
        }
    } else {
        img = iftCreateImage(fimg.xsize-(2*sx),fimg.ysize-(2*sy),1);

        if(iftIsColorImage(fimg)){
            iftSetCbCr(img,128);
            p = 0; u.z = 0;
            for (u.y=sy; u.y < fimg.ysize-sy; u.y++)
                for (u.x=sx; u.x < fimg.xsize-sx; u.x++) {
                    q = iftGetVoxelIndex(fimg,u);
                    img.val[p] = fimg.val[q];
                    img.Cb[p]  = fimg.Cb[q];
                    img.Cr[p]  = fimg.Cr[q];
                    p++;
                }
        }else{
            p = 0; u.z = 0;
            for (u.y=sy; u.y < fimg.ysize-sy; u.y++)
                for (u.x=sx; u.x < fimg.xsize-sx; u.x++) {
                    q = iftGetVoxelIndex(fimg,u);
                    img.val[p] = fimg.val[q];
                    p++;
                }
        }
    }


    return(img);
}

function iftImageCb(img)
{
    var Cb=iftCreateImage(img.xsize,img.ysize,img.zsize);
    var p;

    if (img.Cb === null)
        iftError("There is no color component","iftImageCb");

    for (p=0; p < img.n; p++)
        Cb.val[p] = img.Cb[p];


    iftCopyVoxelSize(img,Cb);

    return(Cb);
}

function iftImageCr(img)
{
    var Cr=iftCreateImage(img.xsize,img.ysize,img.zsize);
    var p;

    if (img.Cr === null)
        iftError("There is no color component","iftImageCb");

    for (p=0; p < img.n; p++)
        Cr.val[p] = img.Cr[p];

    iftCopyVoxelSize(img,Cr);

    return(Cr);
}

// function iftImageValueAtPoint(img, P)
// {
//     var u;
//     var p, i, value;
//     var dx=1.0,dy=1.0,dz=1.0, val;
//
//     u = [new THREE.Vector3(0.0,0.0,0.0), new THREE.Vector3(0.0,0.0,0.0), new THREE.Vector3(0.0,0.0,0.0), new THREE.Vector3(0.0,0.0,0.0),
//         new THREE.Vector3(0.0,0.0,0.0), new THREE.Vector3(0.0,0.0,0.0), new THREE.Vector3(0.0,0.0,0.0), new THREE.Vector3(0.0,0.0,0.0)];
//     p = [0,0,0,0,0,0,0,0];
//     val = [0,0,0,0,0,0];
//
//     if (iftAlmostZero(Math.floor(P.x+1.0)-img.xsize)) dx = 0.0;
//     if (iftAlmostZero(Math.floor(P.y+1.0)-img.ysize)) dy = 0.0;
//     if (iftAlmostZero(Math.floor(P.z+1.0)-img.zsize)) dz = 0.0;
//
//     u[0].x = Math.floor(P.x);      u[0].y = Math.floor(P.y);       u[0].z = Math.floor(P.z);
//     u[1].x = Math.floor((P.x+dx)); u[1].y = Math.floor(P.y);       u[1].z = Math.floor(P.z);
//     u[2].x = Math.floor(P.x);      u[2].y = Math.floor((P.y+dy));  u[2].z = Math.floor(P.z);
//     u[3].x = Math.floor((P.x+dx)); u[3].y = Math.floor((P.y+dy));  u[3].z = Math.floor(P.z);
//     u[4].x = Math.floor(P.x);      u[4].y = Math.floor(P.y);       u[4].z = Math.floor((P.z+dz));
//     u[5].x = Math.floor((P.x+dx)); u[5].y = Math.floor(P.y);       u[5].z = Math.floor((P.z+dz));
//     u[6].x = Math.floor(P.x);      u[6].y = Math.floor((P.y+dy));  u[6].z = Math.floor((P.z+dz));
//     u[7].x = Math.floor((P.x+dx)); u[7].y = Math.floor((P.y+dy));  u[7].z = Math.floor((P.z+dz));
//
//     for (i=0; i < 8; i++) {
//         if (iftValidVoxel(img,u[i])){
//             p[i] = iftGetVoxelIndex(img,u[i]);
//         }else{
//             u[0].x = iftRound(P.x);
//             u[0].y = iftRound(P.y);
//             u[0].z = iftRound(P.z);
//             p[0]   = iftGetVoxelIndex(img,u[0]);
//
//             return(img.val[p[0]]);
//         }
//
//     }
//
//     val[0] = img.val[p[1]]*(P.x-u[0].x)+ img.val[p[0]]*(u[1].x-P.x);
//     val[1] = img.val[p[3]]*(P.x-u[2].x)+ img.val[p[2]]*(u[3].x-P.x);
//     val[2] = img.val[p[5]]*(P.x-u[4].x)+ img.val[p[4]]*(u[5].x-P.x);
//     val[3] = img.val[p[7]]*(P.x-u[6].x)+ img.val[p[6]]*(u[7].x-P.x);
//     val[4] = val[1]*(P.y-u[0].y) + val[0]*(u[2].y-P.y);
//     val[5] = val[3]*(P.y-u[0].y) + val[2]*(u[2].y-P.y);
//     value  = Math.floor(val[5]*(P.z-u[0].z) + val[4]*(u[4].z-P.z) + 0.5);
//
//     return(value);
// }


//a simpler and faster interpolation method
function iftImageValueAtPointNearestNeighbor(img, P) {
    var u = new THREE.Vector3(0.0, 0.0, 0.0);
    var p;

    u.x = iftRound(P.x);
    u.y = iftRound(P.y);
    u.z = iftRound(P.z);

    u.x = iftMin(iftMax(u.x, 0), img.xsize-1);
    u.y = iftMin(iftMax(u.y, 0), img.ysize-1);
    u.z = iftMin(iftMax(u.z, 0), img.zsize-1);

    p = iftGetVoxelIndex(img, u);

    return img.val[p];
}
