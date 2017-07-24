function iftObjectBorders(label, A, include_image_border)
{
    var border = iftCreateImage(label.xsize,label.ysize,label.zsize);

    var u = new THREE.Vector3();

    for (u.z=0; u.z < label.zsize; u.z++)
        for (u.y=0; u.y < label.ysize; u.y++)
            for (u.x=0; u.x < label.xsize; u.x++){
                var p = iftGetVoxelIndex(label,u);
                if (label.val[p]!=0){
                    for (var i=1; i < A.n; i++) {
                        var v = iftGetAdjacentVoxel(A, u, i);
                        if (iftValidVoxel(label,v)){
                            var q = iftGetVoxelIndex(label,v);
                            if (label.val[q] !== label.val[p]){
                                border.val[p] = 255;
                                break;
                            }
                        }else if (include_image_border) {
                            border.val[p] = 255;
                            break;
                        }
                    }
                }
            }
    iftCopyVoxelSize(label,border);

    return(border);
}


function iftObjectBorderSet(label, Ain, include_bkg, include_image_border) {
    if (label === null)
        iftError("Label Image is null", "iftObjectBorderSet");

    var A = Ain;
    if (A === null) {
        if (iftIs3DImage(label))
            A = iftSpheric(1.0);
        else
            A = iftCircular(1.0);
    }

    var border = null;
    var u, v;
    var p, q;

    u = new THREE.Vector3(0,0,0);
    v = new THREE.Vector3(0,0,0);

    for (u.z = 0; u.z < label.zsize; u.z++) {
        for (u.y = 0; u.y < label.ysize; u.y++) {
            for (u.x = 0; u.x < label.xsize; u.x++) {
                p = iftGetVoxelIndex(label, u);

                if (label.val[p] !== 0 || include_bkg) {
                    for (var i = 1; i < A.n; i++) {
                        v.x = u.x + A.dx[i];
                        v.y = u.y + A.dy[i];
                        v.z = u.z + A.dz[i];

                        if (iftValidVoxel(label, v)) {
                            q = iftGetVoxelIndex(label, v);
                            if (label.val[q] !== label.val[p]) {
                                border = iftInsertSet(border, p);
                                break;
                            }
                        } else if(include_image_border){
                            border = iftInsertSet(border, p);
                            break;
                        }
                    }
                }
            }
        }
    }

    return border;
}

function iftSeedsFromLabelAtGeodesicCenters(label, std_radius) {
    var Seeds = iftGeodesicCenters(label);
    var J = {elem:[], label:[], radius: []};
    var A;

    if(iftIs3DImage(label))
        A = iftSpheric(1.8);
    else
        A = iftCircular(1.0);

    var res = iftMultiLabelDistTransFromBorders(label, A, IFT_INTERIOR);

    for (var S = Seeds; S != null; S = S.next) {
        p = S.elem;
        var radius = iftMin(std_radius, Math.sqrt(res.dist.val[p]));

        J.elem.push(p);
        J.label.push(S.label);
        J.radius.push(radius);
    }

    return J;
}