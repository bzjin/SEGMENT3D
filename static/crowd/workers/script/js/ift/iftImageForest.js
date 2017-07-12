/**
 @file
 @brief A description is missing here
 */


function iftImageForest() {
    this.A = null;
    this.img = null;
    this.pathval = null;
    this.label = null;
    this.marker = null;
    this.root = null;
    this.pred = null;
    this.Q = null;
}

function  iftCreateImageForest(img, A)
{
    var fst = new iftImageForest();

    if (fst !== null) {
        fst.pathval        = iftCreateImage(img.xsize,img.ysize,img.zsize);
        fst.label          = iftCreateImage(img.xsize,img.ysize,img.zsize);
        fst.marker         = iftCreateImage(img.xsize,img.ysize,img.zsize);
        fst.root           = iftCreateImage(img.xsize,img.ysize,img.zsize);
        fst.pred           = iftCreateImage(img.xsize,img.ysize,img.zsize);
        fst.Q              = iftCreateGQueue(iftMax(IFT_QSIZE, iftMaximumValue(img) + 1), fst.pathval);
        fst.img            = img;
        fst.A              = A;
    } else {
        iftError(IFT_MSG_MEMORY_ALLOC_ERROR, "iftCreateImageForest");
    }

    // Default
    iftResetImageForest(fst);

    iftCopyVoxelSize(img, fst.pathval);
    iftCopyVoxelSize(img, fst.label);
    iftCopyVoxelSize(img, fst.marker);
    iftCopyVoxelSize(img, fst.root);
    iftCopyVoxelSize(img, fst.pred);

    return(fst);
}

function iftResetImageForest(fst)
{
    var p;
    iftResetGQueue(fst.Q);

    if (fst.Q.C.removal_policy == IFT_MINVALUE){
        for (p=0; p < fst.img.n; p++) {
            fst.pathval.val[p] = IFT_INFINITY_INT;
            fst.label.val[p]   = 0;
            fst.marker.val[p]  = 0;
            fst.pred.val[p]    = IFT_NIL;
            fst.root.val[p]    = p;
        }
    } else { // MAXVALUE
        for (p=0; p < fst.img.n; p++) {
            fst.pathval.val[p] = IFT_INFINITY_INT_NEG;
            fst.label.val[p]   = 0;
            fst.marker.val[p]  = 0;
            fst.pred.val[p]    = IFT_NIL;
            fst.root.val[p]    = p;
        }
    }
}


function iftTreeRemoval(fst, trees_for_removal)
{
    var i, p, q, r, n = fst.img.n, V0;
    var u, v;
    var A = fst.A;
    var Frontier = null;
    var inFrontier = iftCreateBMap(n);
    var pathval = fst.pathval, pred = fst.pred, root = fst.root;
    var img = fst.img;
    var T1 = null, T2 = null;

    if (fst.Q.C.removal_policy === IFT_MINVALUE)
        V0 = IFT_INFINITY_INT;
    else // MAXVALUE
        V0 = IFT_INFINITY_INT_NEG;

    /* Remove all marked trees and find the frontier voxels
     afterwards. */

    while (trees_for_removal !== null)
    {
        p = trees_for_removal.elem;

        if (pathval.val[root.val[p]] !== V0) //tree not marked yet
        {
            r = root.val[p];
            pathval.val[r] = V0; // mark removed node
            pred.val[r] = IFT_NIL;
            T1 = iftInsertSet(T1, r);
            while (T1 !== null)
            {
                [p, T1] = iftRemoveSet(T1);
                T2 = iftInsertSet(T2, p);

                u = iftGetVoxelCoord(img, p);
                for (i = 1; i < A.n; i++)
                {
                    v = iftGetAdjacentVoxel(A, u, i);
                    if (iftValidVoxel(img, v))
                    {
                        q   = iftGetVoxelIndex(img, v);
                        if (pathval.val[q] !== V0)
                        {
                            if (pred.val[q] === p)
                            {
                                T1 = iftInsertSet(T1, q);

                                pathval.val[q] = V0; // mark removed node
                                pred.val[q]    = IFT_NIL;
                            }
                        }
                    }
                }
            }
        }
        trees_for_removal = trees_for_removal.next;
    }

    /* Find the frontier voxels of non-removed trees */

    while (T2 !== null)
    {
        [p, T2] = iftRemoveSet(T2);
        u = iftGetVoxelCoord(img, p);
        for (i = 1; i < A.n; i++)
        {
            v = iftGetAdjacentVoxel(A, u, i);
            if (iftValidVoxel(img, v))
            {
                q   = iftGetVoxelIndex(img, v);
                if (pathval.val[q] !== V0)
                {
                    if (!iftBMapValue(inFrontier, q))
                    {
                        Frontier = iftInsertSet(Frontier, q);
                        iftBMapSet1(inFrontier, q);
                    }
                }
            }
        }
    }

    return (Frontier);
}