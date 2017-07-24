/**
 * Created by tvspina on 1/17/17.
 */

function iftThreshold(img, lowest, highest, value) {
    var bin = iftCreateImage(img.xsize,img.ysize,img.zsize);

    iftThresholdInplace(img, bin, lowest, highest, value);

    return(bin);
}

function iftThresholdInplace(img, bin, lowest, highest, value) {
    var sum = 0;
    for (var p=0; p < img.n; p++) {
        if ((img.val[p] >= lowest) && (img.val[p] <= highest)) {
            bin.val[p] = value;
        } else {
            bin.val[p] = 0;
        }
    }

    iftCopyVoxelSize(img,bin);

    return(bin);
}

function iftAdjacentLabelsAndConnectionPoints(label, A) {
    var i, lb, adj_lb, max_lb = iftMaximumValue(label);

    var neighbors = [];
    var frontier = [];
    for(lb = 0; lb <= max_lb; lb++) {
        neighbors.push([]);
        frontier.push([]);

        for(adj_lb = 0; adj_lb <= max_lb; adj_lb++) {
            frontier[lb].push([]);
        }
    }


    for(var p = 0; p < label.n; p++) {
        var u = iftGetVoxelCoord(label, p);
        var lb_p = label.val[p];
        for(i = 1; i < A.n; i++) {
            var v = iftGetAdjacentVoxel(A, u, i);

            if(iftValidVoxel(label, v)) {
                var q = iftGetVoxelIndex(label, v);
                var lb_q = label.val[q];

                if(lb_p !== lb_q) {
                    // Storing the adjacent label and the first adjacent voxel from that label
                    if(findLabelIndex(neighbors[lb_p], lb_q) < 0) {
                        neighbors[lb_p].push({label: lb_q, voxel: q});
                    }

                    // Selecting the frontier between labels, for each pair of label-adjacent label
                    frontier[lb_p][lb_q].push(v);
                }
            }
        }
    }

    // Finding, for each label L, the voxel from the adjacent label K that is closest to the geometric center of the
    // boundary between the two labels, for each K adjacent to L. That voxel will replace the originally selected
    // in the previous step
    for(lb = 0; lb <= max_lb; lb++) {
        for(adj_lb = 0; adj_lb <= max_lb; adj_lb++) {
            var n = frontier[lb][adj_lb].length;

            if(n > 0) {
                var geom_center = new THREE.Vector3();
                var clst = null;
                var min_dist = IFT_INFINITY_DBL;

                for (i = 0; i < n; i++) {
                    geom_center.add(frontier[lb][adj_lb][i]);
                }

                geom_center.divideScalar(n);

                for (i = 0; i < n; i++) {
                    var dist = geom_center.distanceTo(frontier[lb][adj_lb][i]);

                    if(dist < min_dist) {
                        min_dist = dist;
                        clst = frontier[lb][adj_lb][i].clone();
                    }
                }

                var idx = findLabelIndex(neighbors[lb], adj_lb);
                neighbors[lb][idx].voxel = iftGetVoxelIndex(label, clst);
            }
        }
    }

    return neighbors;
}

function iftAdjacentLabelsAndConnectionPointsSet(label, A, sel_voxels) {
    var i, lb, adj_lb, max_lb = iftMaximumValue(label);

    var neighbors = [];
    var frontier = [];
    for(lb = 0; lb <= max_lb; lb++) {
        neighbors.push([]);
        frontier.push([]);

        for(adj_lb = 0; adj_lb <= max_lb; adj_lb++) {
            frontier[lb].push([]);
        }
    }

    for(var S = sel_voxels; S !== null; S = S.next) {
        var p = S.elem;
        var u = iftGetVoxelCoord(label, p);
        var lb_p = label.val[p];
        for(i = 1; i < A.n; i++) {
            var v = iftGetAdjacentVoxel(A, u, i);

            if(iftValidVoxel(label, v)) {
                var q = iftGetVoxelIndex(label, v);
                var lb_q = label.val[q];

                if(lb_p !== lb_q) {
                    // Storing the adjacent label and the first adjacent voxel from that label
                    if(findLabelIndex(neighbors[lb_p], lb_q) < 0) {
                        neighbors[lb_p].push({label: lb_q, voxel: q});
                    }

                    // Selecting the frontier between labels, for each pair of label-adjacent label
                    frontier[lb_p][lb_q].push(v);
                }
            }
        }
    }

    // Finding, for each label L, the voxel from the adjacent label K that is closest to the geometric center of the
    // boundary between the two labels, for each K adjacent to L. That voxel will replace the originally selected
    // in the previous step
    for(lb = 0; lb <= max_lb; lb++) {
        for(adj_lb = 0; adj_lb <= max_lb; adj_lb++) {
            var n = frontier[lb][adj_lb].length;

            if(n > 0) {
                var geom_center = new THREE.Vector3();
                var clst = null;
                var min_dist = IFT_INFINITY_DBL;

                for (i = 0; i < n; i++) {
                    geom_center.add(frontier[lb][adj_lb][i]);
                }

                geom_center.divideScalar(n);

                for (i = 0; i < n; i++) {
                    var dist = geom_center.distanceTo(frontier[lb][adj_lb][i]);

                    if(dist < min_dist) {
                        min_dist = dist;
                        clst = frontier[lb][adj_lb][i].clone();
                    }
                }

                var idx = findLabelIndex(neighbors[lb], adj_lb);
                neighbors[lb][idx].voxel = iftGetVoxelIndex(label, clst);
            }
        }
    }

    return neighbors;
}


function iftWatershed(basins, Ain, seeds, forbidden) {
    var pathval = null, label = null;
    var Q = null;
    var i, p, q, tmp;
    var u, v;
    var S = seeds;

    var A = null;
    if (Ain === null) {
        if (iftIs3DImage(basins)) {
            A = iftSpheric(1.0);
        } else {
            A = iftCircular(1.5);
        }
    } else {
        A = Ain;
    }

    // Initialization
    pathval = iftCreateImage(basins.xsize, basins.ysize, basins.zsize);
    label   = iftCreateImage(basins.xsize, basins.ysize, basins.zsize);
    Q       = iftCreateGQueue(iftMaximumValue(basins) + 1, pathval);
    for (p = 0; p < basins.n; p++)
    {
        pathval.val[p] = IFT_INFINITY_INT;
    }

    // sets the forbidden region
    var F = forbidden;
    while (F !== null) {
        p   =  F.elem;
        pathval.val[p] = IFT_INFINITY_INT_NEG;
        F = F.next;
    }

    while (S !== null)
    {
        p = S.elem;
        label.val[p] = S.label;
        pathval.val[p] = 0;
        iftInsertGQueue(Q, p);
        S = S.next;
    }


    // Image Foresting Transform

    while (!iftEmptyGQueue(Q))
    {
        p = iftRemoveGQueue(Q);
        u = iftGetVoxelCoord(basins, p);

        for (i = 1; i < A.n; i++)
        {
            v = iftGetAdjacentVoxel(A, u, i);

            if (iftValidVoxel(basins, v))
            {
                q = iftGetVoxelIndex(basins, v);
                if (pathval.val[q] > pathval.val[p])
                {
                    tmp = iftMax(pathval.val[p], basins.val[q]);
                    if (tmp < pathval.val[q])  // For this path-value function,
                    {
                        // this implies that q has never
                        // been inserted in Q.
                        label.val[q] = label.val[p];
                        pathval.val[q]  = tmp;
                        iftInsertGQueue(Q, q);
                    }
                }
            }
        }
    }

    iftCopyVoxelSize(basins, label);
    console.log(basins, label);
    return (label);
}


/**
 @brief Computes the watershed transform in a forest structure.

 Complexity: O(|A| * |V|).

 @param  fst  iftImageForest.    Forest structure created with a gradient image.
 @param  seed iftLabeledSet.     List of spels with image index and seed label.
 @param  removal_markers iftSet. List of spels marked for removal. null if empty

 @return void. All forest maps are updated by reference.
 */
function iftDiffWatershed(fst, seed, removal_markers)
{
    var A = fst.A;
    var Q = fst.Q;
    var u, v;
    var i, p, q, tmp;
    var Frontier = null;
    var S = null;
    var pathval = fst.pathval, pred = fst.pred, label = fst.label;
    var root = fst.root, basins = fst.img, marker = fst.marker;

    if (removal_markers !== null)
    {
        Frontier = iftTreeRemoval(fst, removal_markers);

        while (Frontier !== null)
        {
            [p, Frontier] = iftRemoveSet(Frontier);
            iftInsertGQueue(Q, p);
        }
    }

    S = seed;
    while (S !== null)
    {
        p = S.elem;

        if (Q.L.color[p] == IFT_GRAY)
        {
            /* p is also a frontier voxel, but the priority is it as a seed. */
            iftRemoveGQueueElem(Q, p);
        }

        label.val[p]   = S.label;
        pathval.val[p] = 0;
        root.val[p]    = p;
        pred.val[p]    = IFT_NIL;
        marker.val[p]  = S.marker;
        iftInsertGQueue(Q, p);
        S = S.next;
    }

    /* Image Foresting Transform */
    while (!iftEmptyGQueue(Q))
    {
        p = iftRemoveGQueue(Q);
        u = iftGetVoxelCoord(basins, p);

        for (i = 1; i < A.n; i++)
        {
            v = iftGetAdjacentVoxel(A, u, i);
            if (iftValidVoxel(basins, v))
            {
                q = iftGetVoxelIndex(basins, v);

                tmp = iftMax(pathval.val[p], basins.val[q]);

                /* if pred[q]=p then p and q belong to a tie-zone */
                if ((tmp < pathval.val[q]) || ((pred.val[q] == p))) {
                    if (Q.L.color[q] == IFT_GRAY) {
                        iftRemoveGQueueElem(Q, q);
                    }
                    pred.val[q] = p;
                    root.val[q] = root.val[p];
                    label.val[q] = label.val[p];
                    marker.val[q] = marker.val[p];
                    pathval.val[q] = tmp;
                    iftInsertGQueue(Q, q);
                }
            }
        }
    }
    iftResetGQueue(Q);
}

function iftFindClosestAdjacentLabelToVoxel(label, lb, voxel) {
    var Q = [];
    var A;
    var found = -1, found_lb = -1, idx;

    if(iftIs3DImage(label))
        A = iftSpheric(1.0);
    else
        A = iftCircular(1.5);

    Q.push(voxel);

    idx = 0;
    while(idx < Q.length && found < 0) {
        var p = Q[idx];
        var u = iftGetVoxelCoord(label, p);

        idx++;

        for(var i = 1; i < A.n; i++) {
            var v = iftGetAdjacentVoxel(A, u, i);

            if(iftValidVoxel(label, v)) {
                var q = iftGetVoxelIndex(label, v);

                if(label.val[q] !== lb) {
                    found = q;
                    found_lb = label.val[q];
                } else {
                    Q.push(q);
                }
            }
        }
    }

    return {lb: found_lb, voxel: found};
}