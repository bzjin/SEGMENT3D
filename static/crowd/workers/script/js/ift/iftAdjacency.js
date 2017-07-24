/**
 * Created by tvspina on 1/17/17.
 */

function iftAdjRel(n) {
    this.n = n;
    this.dx = iftAllocIntArray(n);
    this.dy = iftAllocIntArray(n);
    this.dz = iftAllocIntArray(n);
}

function iftCreateAdjRel(n) {
    return new iftAdjRel(n);
}

function iftSpheric(r) {
    var A = null;
    var i,j,k,n,r0,d,dx,dy,dz,i0=0;
    var dr = null,aux,r2;

    n=0;
    r0  = Math.floor(r);
    r2  = Math.floor(r*r + 0.5);
    for(dz=-r0;dz<=r0;dz++)
        for(dy=-r0;dy<=r0;dy++)
            for(dx=-r0;dx<=r0;dx++)
                if(((dx*dx)+(dy*dy)+(dz*dz)) <= r2)
                    n++;

    A = iftCreateAdjRel(n);
    i=0;
    for(dz=-r0;dz<=r0;dz++)
        for(dy=-r0;dy<=r0;dy++)
            for(dx=-r0;dx<=r0;dx++)
                if(((dx*dx)+(dy*dy)+(dz*dz)) <= r2){
                    A.dx[i]=dx;
                    A.dy[i]=dy;
                    A.dz[i]=dz;
                    if ((dx==0)&&(dy==0)&&(dz==0))
                        i0 = i;
                    i++;
                }

    /* shift to right and place central voxel at first */

    for (i=i0; i > 0; i--) {
        dx = A.dx[i];
        dy = A.dy[i];
        dz = A.dz[i];
        A.dx[i] = A.dx[i-1];
        A.dy[i] = A.dy[i-1];
        A.dz[i] = A.dz[i-1];
        A.dx[i-1] = dx;
        A.dy[i-1] = dy;
        A.dz[i-1] = dz;
    }

    /* sort by radius, so the 6 closest neighbors will come first */

    dr = new iftAllocFloatArray(A.n);
    for (i=0; i < A.n; i++) {
        dr[i] = A.dx[i]*A.dx[i] + A.dy[i]*A.dy[i] + A.dz[i]*A.dz[i];
    }

    for (i=1; i < A.n-1; i++){
        k = i;
        for (j=i+1; j < A.n; j++)
            if (dr[j] < dr[k]){
                k = j;
            }
        aux   = dr[i];
        dr[i] = dr[k];
        dr[k] = aux;
        d        = A.dx[i];
        A.dx[i] = A.dx[k];
        A.dx[k] = d;
        d        = A.dy[i];
        A.dy[i] = A.dy[k];
        A.dy[k] = d;
        d        = A.dz[i];
        A.dz[i] = A.dz[k];
        A.dz[k] = d;
    }

    return(A);
}


function iftCircular(r)
{
    var A=null;
    var i,j,k,n,dx,dy,r0,d,i0=0;
    var dr,aux,r2;

    n=0;

    r0  = Math.floor(r);
    r2  = Math.floor(r*r + 0.5);
    for(dy=-r0;dy<=r0;dy++)
        for(dx=-r0;dx<=r0;dx++)
            if(((dx*dx)+(dy*dy)) <= r2)
                n++;

    A = iftCreateAdjRel(n);
    i=0;
    for(dy=-r0;dy<=r0;dy++)
        for(dx=-r0;dx<=r0;dx++)
            if(((dx*dx)+(dy*dy)) <= r2){
                A.dx[i]=dx;
                A.dy[i]=dy;
                A.dz[i]=0;
                if ((dx==0)&&(dy==0))
                    i0 = i;
                i++;
            }

    /* shift to right and place central pixel at first */

    for (i=i0; i > 0; i--) {
        dx = A.dx[i];
        dy = A.dy[i];
        A.dx[i] = A.dx[i-1];
        A.dy[i] = A.dy[i-1];
        A.dx[i-1] = dx;
        A.dy[i-1] = dy;
    }

    /* sort by radius, so the 4 closest neighbors will come first */

    dr = iftAllocFloatArray(A.n);
    for (i=0; i < A.n; i++) {
        dr[i] = A.dx[i]*A.dx[i] + A.dy[i]*A.dy[i];
    }

    for (i=1; i < A.n-1; i++){
        k = i;
        for (j=i+1; j < A.n; j++)
            if (dr[j] < dr[k]){
                k = j;
            }
        aux   = dr[i];
        dr[i] = dr[k];
        dr[k] = aux;
        d        = A.dx[i];
        A.dx[i] = A.dx[k];
        A.dx[k] = d;
        d        = A.dy[i];
        A.dy[i] = A.dy[k];
        A.dy[k] = d;
    }

    return(A);
}


function iftGetAdjacentVoxel(A, u, adj)
{
    var v = new THREE.Vector3(0,0,0);

    v.x = u.x + A.dx[adj];
    v.y = u.y + A.dy[adj];
    v.z = u.z + A.dz[adj];

    return(v);
}


/*! \brief Creates a circular adjacency on a given plane of the 3D space. Tolerance_dist is a parameter to deal with aliasing,
 * all voxels within that distance to the plane are considered in the adjacency. */
function iftCircularOnPlane(r, plane, tolerance_dist)
{
    var A=null;
    var i,j,k,n,r0,d,dx,dy,dz,i0=0, v;
    var dr,aux,r2;
    var plane_at_origin = new THREE.Plane(plane.normal.clone().normalize(), 0);

    n=0;
    r0  = Math.floor(r);
    r2  = Math.floor(r*r + 0.5);
    for(dz=-r0;dz<=r0;dz++)
        for(dy=-r0;dy<=r0;dy++)
            for(dx=-r0;dx<=r0;dx++)
                if(((dx*dx)+(dy*dy)+(dz*dz)) <= r2) {
                    v = new THREE.Vector3(dx, dy, dz);

                    if(Math.abs(plane_at_origin.distanceToPoint(v)) <= tolerance_dist) {
                        n++;
                    }
                }

    A = iftCreateAdjRel(n);
    i=0;
    for(dz=-r0;dz<=r0;dz++)
        for(dy=-r0;dy<=r0;dy++)
            for(dx=-r0;dx<=r0;dx++)
                if(((dx*dx)+(dy*dy)+(dz*dz)) <= r2){
                    v = new THREE.Vector3(dx, dy, dz);

                    if ((dx==0)&&(dy==0)&&(dz==0))
                        i0 = i;

                    if(Math.abs(plane_at_origin.distanceToPoint(v)) <= tolerance_dist) {
                        A.dx[i] = dx;
                        A.dy[i] = dy;
                        A.dz[i] = dz;
                        i++;
                    }
                }

    /* shift to right and place central voxel at first */

    for (i=i0; i > 0; i--) {
        dx = A.dx[i];
        dy = A.dy[i];
        dz = A.dz[i];
        A.dx[i] = A.dx[i-1];
        A.dy[i] = A.dy[i-1];
        A.dz[i] = A.dz[i-1];
        A.dx[i-1] = dx;
        A.dy[i-1] = dy;
        A.dz[i-1] = dz;
    }

    /* sort by radius, so the closest neighbors will come first */

    dr = iftAllocFloatArray(A.n);
    for (i=0; i < A.n; i++) {
        dr[i] = A.dx[i]*A.dx[i] + A.dy[i]*A.dy[i] + A.dz[i]*A.dz[i];
    }

    for (i=1; i < A.n-1; i++){
        k = i;
        for (j=i+1; j < A.n; j++)
            if (dr[j] < dr[k]){
                k = j;
            }
        aux   = dr[i];
        dr[i] = dr[k];
        dr[k] = aux;
        d        = A.dx[i];
        A.dx[i] = A.dx[k];
        A.dx[k] = d;
        d        = A.dy[i];
        A.dy[i] = A.dy[k];
        A.dy[k] = d;
        d        = A.dz[i];
        A.dz[i] = A.dz[k];
        A.dz[k] = d;
    }

    return(A);
}
