function  iftMultiLabelDistTransFromBorders(label, A, side)
{
    var S = null;
    var B = null;

    if (!iftIs3DImage(label)) // 2D
        B = iftCircular(1.0);
    else // 3D
        B = iftSpheric(1.0);

    S = iftObjectBorderSet(label, B, false, false);

    return iftMultiLabelDistTransFromSet(S, label, A, side);
}


function iftMultiLabelDistTransFromSet(S, label, A, side){
    return iftMultiLabelShellDistTransFromSet(S, label, A, side, IFT_INFINITY_DBL);
}

function iftMultiLabelShellDistTransFromSet(S, label, A, side, max_dist){
    var Q=null;
    var i,p,q,tmp;
    var u,v,r;

    max_dist *= max_dist;

    // Initialization
    var dist  = iftCreateImage(label.xsize,label.ysize,label.zsize);
    var root  = iftCreateImage(label.xsize,label.ysize,label.zsize);
    Q  = iftCreateGQueue(IFT_QSIZE,dist);

    switch (side) {
        case IFT_INTERIOR:
            for (p=0; p < label.n; p++) {
                if (label.val[p] > 0)
                    dist.val[p] = IFT_INFINITY_INT;
            }
            break;
        case IFT_EXTERIOR:
            for (p=0; p < label.n; p++) {
                if (label.val[p] === 0)
                    dist.val[p] = IFT_INFINITY_INT;
            }
            break;
        case IFT_BOTH:
        default:
            for (p=0; p < label.n; p++) {
                dist.val[p] = IFT_INFINITY_INT;
            }
            break;
    }

    while (S != null) {
        p = S.elem;
        dist.val[p] = 0;
        root.val[p] = p;
        iftInsertGQueue(Q,p);
        S = S.next;
    }

    // Image Foresting Transform

    while(!iftEmptyGQueue(Q)) {
        p=iftRemoveGQueue(Q);

        if (dist.val[p] <= max_dist){

            u = iftGetVoxelCoord(label,p);
            r = iftGetVoxelCoord(label,root.val[p]);

            for (i=1; i < A.n; i++){
                v = iftGetAdjacentVoxel(A,u,i);
                if (iftValidVoxel(label,v)){
                    q = iftGetVoxelIndex(label,v);
                    if (dist.val[q] > dist.val[p]){
                        tmp = Math.floor((v.x-r.x)*(v.x-r.x) + (v.y-r.y)*(v.y-r.y) + (v.z-r.z)*(v.z-r.z));
                        if (tmp < dist.val[q]){
                            if (!iftAlmostZero(dist.val[q] - IFT_INFINITY_INT))
                                iftRemoveGQueueElem(Q, q);

                            dist.val[q]  = tmp;
                            root.val[q]  = root.val[p];
                            iftInsertGQueue(Q, q);
                        }
                    }
                }
            }
        }
    }

    iftCopyVoxelSize(label, dist);
    iftCopyVoxelSize(label, root);

    return {dist: dist, root: root};
}
