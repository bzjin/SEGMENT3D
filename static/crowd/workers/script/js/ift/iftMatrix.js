function iftMatrix(ncols, nrows) {
    this.ncols = ncols;
    this.nrows = nrows;

    this.tbrow = iftAllocIntArray(nrows);
    for (var r = 0; r < nrows; r++) {
        this.tbrow[r] = r * ncols;
    }
    this.n =  ncols *  nrows;
	this.allocated = true;
    this.val = iftAllocFloatArray(this.n);
}

function iftGetMatrixCol(m,i) {
    return iftSafeMod(i, m.ncols);
}

function iftGetMatrixRow(m,i) {
    return Math.floor(i / m.ncols);
}

function iftGetMatrixIndex(m,c,r) {
    return (c+m.tbrow[r]);
}


function iftCreateMatrix(ncols, nrows) {
    return new iftMatrix(ncols, nrows);
}

function iftScaleMatrix(sx, sy, sz) {
    var A;

    A = iftCreateMatrix(4, 4);

    A.val[iftGetMatrixIndex(A, 0, 0)] = sx;
    A.val[iftGetMatrixIndex(A, 1, 0)] = 0.0;
    A.val[iftGetMatrixIndex(A, 2, 0)] = 0.0;
    A.val[iftGetMatrixIndex(A, 3, 0)] = 0.0;

    A.val[iftGetMatrixIndex(A, 0, 1)] = 0.0;
    A.val[iftGetMatrixIndex(A, 1, 1)] = sy;
    A.val[iftGetMatrixIndex(A, 2, 1)] = 0.0;
    A.val[iftGetMatrixIndex(A, 3, 1)] = 0.0;

    A.val[iftGetMatrixIndex(A, 0, 2)] = 0.0;
    A.val[iftGetMatrixIndex(A, 1, 2)] = 0.0;
    A.val[iftGetMatrixIndex(A, 2, 2)] = sz;
    A.val[iftGetMatrixIndex(A, 3, 2)] = 0.0;

    A.val[iftGetMatrixIndex(A, 0, 3)] = 0.0;
    A.val[iftGetMatrixIndex(A, 1, 3)] = 0.0;
    A.val[iftGetMatrixIndex(A, 2, 3)] = 0.0;
    A.val[iftGetMatrixIndex(A, 3, 3)] = 1.0;

    return (A);
}

function iftTransformPoint(M, v) {
    var v1 = new THREE.Vector3(0.0, 0.0, 0.0);

    // Since iftMultMatrices uses cblas, it is faster to simply do the transformation
    // directly because iftPoint only has 3 coordinates
    v1.x = M.val[iftGetMatrixIndex(M, 0, 0)] * v.x + M.val[iftGetMatrixIndex(M, 1, 0)] * v.y +
           M.val[iftGetMatrixIndex(M, 2, 0)] * v.z + M.val[iftGetMatrixIndex(M, 3, 0)];
    v1.y = M.val[iftGetMatrixIndex(M, 0, 1)] * v.x + M.val[iftGetMatrixIndex(M, 1, 1)] * v.y +
           M.val[iftGetMatrixIndex(M, 2, 1)] * v.z + M.val[iftGetMatrixIndex(M, 3, 1)];
    v1.z = M.val[iftGetMatrixIndex(M, 0, 2)] * v.x + M.val[iftGetMatrixIndex(M, 1, 2)] * v.y +
           M.val[iftGetMatrixIndex(M, 2, 2)] * v.z + M.val[iftGetMatrixIndex(M, 3, 2)];

    return (v1);
}