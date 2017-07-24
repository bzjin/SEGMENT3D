// function iftScaleImage(img, sx, sy, sz)
// {
//     var simg;
//     var InvS;
//     var P1 = new THREE.Vector3(0.0, 0.0, 0.0),P2 = new THREE.Vector3(0.0, 0.0, 0.0);
//     var v = new THREE.Vector3(0.0, 0.0, 0.0), u = new THREE.Vector3(0.0, 0.0, 0.0);
//     var q, xsize, ysize, zsize;
//
//     if (!iftIs3DImage(img))
//         iftError("Use iftScaleImage2D","iftScaleImage");
//
//     if (iftAlmostZero(sx)||iftAlmostZero(sy)||iftAlmostZero(sz))
//         iftError("Invalid scale factors","iftScaleImage");
//
//     xsize = iftRound(Math.abs(sx * img.xsize));
//     ysize = iftRound(Math.abs(sy * img.ysize));
//     zsize = iftRound(Math.abs(sz * img.zsize));
//
//     simg = iftCreateImage(xsize,ysize,zsize);
//
//     InvS=iftScaleMatrix(1.0/sx,1.0/sy,1.0/sz);
//
//     simg.dx = img.dx/Math.abs(sx);
//     simg.dy = img.dy/Math.abs(sy);
//     simg.dz = img.dz/Math.abs(sz);
//
//     for (v.z = 0; v.z < simg.zsize; v.z++) {
//         for (v.y = 0; v.y < simg.ysize; v.y++) {
//             for (v.x = 0; v.x < simg.xsize; v.x++) {
//                 q = iftGetVoxelIndex(simg, v);
//                 P1.x = v.x;
//                 P1.y = v.y;
//                 P1.z = v.z;
//                 P2 = iftTransformPoint(InvS, P1);
//                 u.x = iftRound(P2.x);
//                 u.y = iftRound(P2.y);
//                 u.z = iftRound(P2.z);
//                 if (iftValidVoxel(img, u)) {
//                     simg.val[q] = iftImageValueAtPoint(img, P2);
//                 }
//             }
//         }
//     }
//
//
//     return(simg);
// }


function iftScaleImageByNearestNeighbor(img, sx, sy, sz)
{
    var simg = null;
    var InvS = null;
    var P1 = new THREE.Vector3(0.0, 0.0, 0.0),P2 = new THREE.Vector3(0.0, 0.0, 0.0);
    var v = new THREE.Vector3(0.0, 0.0, 0.0), u = new THREE.Vector3(0.0, 0.0, 0.0);
    var q, xsize, ysize,zsize;

    if (!iftIs3DImage(img))
        iftError("Image must be 3D","iftScaleImageByNearestNeighbor");

    xsize=iftRound(Math.abs(sx*img.xsize));
    ysize=iftRound(Math.abs(sy*img.ysize));
    zsize=iftRound(Math.abs(sz*img.zsize));

    if (iftAlmostZero(sx) || iftAlmostZero(sy) || iftAlmostZero(sz))
        iftError("Invalid scale factors","iftScaleImageByNearestNeighbor");

    InvS=iftScaleMatrix(1.0/sx,1.0/sy,1.0/sz);

    simg = iftCreateImage(xsize,ysize,zsize);
    simg.dx = img.dx/Math.abs(sx);
    simg.dy = img.dy/Math.abs(sy);
    simg.dz = img.dz/Math.abs(sz);


    if (iftIsColorImage(img)) {
        iftSetCbCr(simg,128);
        var Cb = iftImageCb(img);
        var Cr = iftImageCr(img);
        for (v.z = 0; v.z < simg.zsize; v.z++)
            for (v.y = 0; v.y < simg.ysize; v.y++)
                for (v.x = 0; v.x < simg.xsize; v.x++){
                    q    = iftGetVoxelIndex(simg,v);
                    P1.x = v.x;
                    P1.y = v.y;
                    P1.z = v.z;
                    P2   = iftTransformPoint(InvS,P1);
                    u.x  = iftRound(P2.x);
                    u.y  = iftRound(P2.y);
                    u.z  = iftRound(P2.z);
                    if (iftValidVoxel(img,u)){
                        simg.val[q] = iftImageValueAtPointNearestNeighbor(img,P2);
                        simg.Cb[q] = iftImageValueAtPointNearestNeighbor(Cb,P2);
                        if (simg.Cb[q]===null) simg.Cb[q]=128;
                        simg.Cr[q] = iftImageValueAtPointNearestNeighbor(Cr,P2);
                        if (simg.Cr[q]===null) simg.Cr[q]=128;
                    }else{
                        simg.Cb[q]=simg.Cr[q]=128;
                    }
                }
    }else{
        for (v.z = 0; v.z < simg.zsize; v.z++)
            for (v.y = 0; v.y < simg.ysize; v.y++)
                for (v.x = 0; v.x < simg.xsize; v.x++){
                    q    = iftGetVoxelIndex(simg,v);
                    P1.x = v.x;
                    P1.y = v.y;
                    P1.z = v.z;
                    P2   = iftTransformPoint(InvS,P1);
                    u.x  = iftRound(P2.x);
                    u.y  = iftRound(P2.y);
                    u.z  = iftRound(P2.z);
                    if (iftValidVoxel(img,u)){
                        simg.val[q] = iftImageValueAtPointNearestNeighbor(img,P2);
                    }
                }
    }

    return(simg);
}

function iftResizeImage(img, xsize, ysize, zsize) {
    return iftInterp(img, ( xsize) / img.xsize, ( ysize) / img.ysize, ( zsize) / img.zsize);
}


function iftInterp(img, sx, sy, sz)
{
    var ximg, yimg, zimg;
    var xsize,ysize,zsize;
    var u = new THREE.Vector3(0.0,0.0,0.0), v = new THREE.Vector3(0.0,0.0,0.0), w = new THREE.Vector3(0.0,0.0,0.0);
    var y,z, q, p, r, dx, dy, dz;

    if (!iftIs3DImage(img))
        iftError("Use iftInterp2D for 2D images","iftInterp");
    if ((sx <= 0.0)||(sy <= 0.0)||(sz <= 0.0))
        iftError("Invalid scale factors","iftInterp");

    xsize= iftRound(Math.abs(sx * img.xsize));
    ysize= iftRound(Math.abs(sy * img.ysize));
    zsize= iftRound(Math.abs(sz * img.zsize));

    if (!iftAlmostZero(sx - 1.0) ) {

        /* Interpolate along x */

        ximg = iftCreateImage(xsize,img.ysize, img.zsize);
        ximg.dx = img.dx/sx;
        ximg.dy = img.dy;
        ximg.dz = img.dz;


        for (z = 0; z < ximg.zsize; z++){
            u = new THREE.Vector3(0.0,0.0,0.0);
            v = new THREE.Vector3(0.0,0.0,0.0);
            w = new THREE.Vector3(0.0,0.0,0.0);
            u.z = w.z = v.z = z;
            for (v.y = 0; v.y < ximg.ysize; v.y++){
                u.y = w.y = v.y;
                for (v.x = 0; v.x < ximg.xsize; v.x++){
                    q    = iftGetVoxelIndex(ximg,v);
                    u.x  = Math.floor(v.x/sx);
                    dx   = (v.x/sx) - u.x;
                    w.x  = (iftAlmostZero((u.x+1)-img.xsize))?u.x:u.x+1;
                    p    = iftGetVoxelIndex(img,u);
                    r    = iftGetVoxelIndex(img,w);
                    ximg.val[q] = Math.floor(img.val[p]*(1.0-dx)+img.val[r]*dx);
                }
            }
        }
    }else{
        ximg = iftCopyImage(img);
    }

    if (!iftAlmostZero(sy - 1.0)) {

        /* Interpolate along y */

        yimg = iftCreateImage(xsize,ysize, img.zsize);
        yimg.dx = ximg.dx;
        yimg.dy = ximg.dy/sy;
        yimg.dz = ximg.dz;

        for (z = 0; z < yimg.zsize; z++){
            u = new THREE.Vector3(0.0,0.0,0.0);
            v = new THREE.Vector3(0.0,0.0,0.0);
            w = new THREE.Vector3(0.0,0.0,0.0);
            u.z = w.z = v.z = z;
            for (v.x = 0; v.x < yimg.xsize; v.x++){
                u.x = w.x = v.x;
                for (v.y = 0; v.y < yimg.ysize; v.y++){
                    q    = iftGetVoxelIndex(yimg,v);
                    u.y  = Math.floor(v.y/sy);
                    dy   = (v.y/sy) - u.y;
                    w.y  = (iftAlmostZero((u.y+1)-ximg.ysize))?u.y:u.y+1;
                    p    = iftGetVoxelIndex(ximg,u);
                    r    = iftGetVoxelIndex(ximg,w);
                    yimg.val[q] = Math.floor(ximg.val[p]*(1.0-dy)+ximg.val[r]*dy);
                }
            }
        }
    } else {
        yimg = iftCopyImage(ximg);
    }

    if (!iftAlmostZero(sz - 1.0)) {

        /* Interpolate along z */

        zimg = iftCreateImage(xsize,ysize,zsize);
        zimg.dx = yimg.dx;
        zimg.dy = yimg.dy;
        zimg.dz = yimg.dz/sz;

        for (y = 0; y < zimg.ysize; y++){
            u = new THREE.Vector3(0.0,0.0,0.0);
            v = new THREE.Vector3(0.0,0.0,0.0);
            w = new THREE.Vector3(0.0,0.0,0.0);
            u.y = w.y = v.y = y;
            for (v.x = 0; v.x < zimg.xsize; v.x++){
                u.x = w.x = v.x;
                for (v.z = 0; v.z < zimg.zsize; v.z++){
                    q    = iftGetVoxelIndex(zimg,v);
                    u.z  = Math.floor(v.z/sz);
                    dz   = (v.z/sz) - u.z;
                    w.z  = (iftAlmostZero((u.z+1)-yimg.zsize))?u.z:u.z+1;
                    p    = iftGetVoxelIndex(yimg,u);
                    r    = iftGetVoxelIndex(yimg,w);
                    zimg.val[q] = Math.floor(yimg.val[p]*(1.0-dz)+yimg.val[r]*dz);
                }
            }
        }

    } else {
        zimg = iftCopyImage(yimg);
    }

    return(zimg);
}
