/**
 * Created by tvspina on 1/17/17.
 */



function iftErode(img, A)
{
    var ero = iftCreateImage(img.xsize,img.ysize,img.zsize);

    for (p=0; p < img.n; p++) {
        var u = iftGetVoxelCoord(img, p);
        ero.val[p] = img.val[p];
        for (var i = 1; i < A.n; i++) {
            var v = iftGetAdjacentVoxel(A, u, i);
            if (iftValidVoxel(img, v)) {
                var q = iftGetVoxelIndex(img, v);
                if (img.val[q] < ero.val[p])
                    ero.val[p] = img.val[q];
            }
        }
    }

    if (iftIsColorImage(img))
        iftCopyCbCr(img,ero);

    iftCopyVoxelSize(img,ero);

    return(ero);
}


function iftErodeBinBoundingBox(img, A, bb)
{
    var ero = iftCreateImage(img.xsize,img.ysize,img.zsize);
    var u = new THREE.Vector3(0,0,0);
    for(u.z = bb.begin.z; u.z <= bb.end.z; u.z++)
        for(u.y = bb.begin.y; u.y <= bb.end.y; u.y++)
            for(u.x = bb.begin.x; u.x <= bb.end.x; u.x++) {
                var p = iftGetVoxelIndex(img, u);
                ero.val[p] = img.val[p];
                if(ero.val[p] > 0) {
                    for (var i = 1; i < A.n; i++) {
                        var v = iftGetAdjacentVoxel(A, u, i);
                        if (iftValidVoxel(img, v)) {
                            var q = iftGetVoxelIndex(img, v);
                            if (img.val[q] < ero.val[p])
                                ero.val[p] = img.val[q];
                        }
                    }
                }
            }

    if (iftIsColorImage(img))
        iftCopyCbCr(img,ero);

    iftCopyVoxelSize(img,ero);

    return(ero);
}

function iftErodeIndividualLabels(label, radius, A, borders) {
    var dist = null;
    var ero = iftCreateImage(label.xsize, label.ysize, label.zsize);
    var __res = null;


    if (borders === undefined || borders === null) {
        var B = null;

        if (!iftIs3DImage(label)) // 2D
            B = iftCircular(1.0);
        else // 3D
            B = iftSpheric(1.0);

        borders = iftObjectBorderSet(label, B, false, false);
    }

    __res = iftMultiLabelShellDistTransFromSet(borders, label, A, IFT_INTERIOR, radius);
    dist = __res.dist;

    radius = radius*radius;

    for(var p = 0; p < label.n; p++) {
        if(label.val[p] !== 0) {
            if(dist.val[p] >= radius) {
                ero.val[p] = label.val[p];
            }
        }
    }

    return ero;
}