/**
 * Created by tvspina on 3/20/17.
 */

function perpendicularVector(u) {
    var v = new THREE.Vector3();
    var normal = u.clone().normalize();

    if(!iftAlmostZero(normal.x)) {
        v.y = 1;
        v.z = 1;
        v.x = (-normal.y - normal.z) / normal.x;
    } else if(!iftAlmostZero(normal.y)) {
        v.x = 1;
        v.z = 1;
        v.y = (-normal.x - normal.z) / normal.y;
    } else {
        v.x = 1;
        v.y = 1;
        v.z = (-normal.x - normal.y) / normal.z;
    }

    return v.normalize();
}



// From http://math.stackexchange.com/questions/73237/parametric-equation-of-a-circle-in-3d-space
function createCircleOnPlaneFromStartingPoint(plane, center, point_on_circle, ntriangles) {
    var radius = center.distanceTo(point_on_circle);
    var plane_normal = plane.normal.clone().normalize();
    // Computing normalized vectors on the circle relative to its center, with a 90 degrees difference between them
    var point_on_circle_norm = (new THREE.Vector3()).subVectors(point_on_circle, center).normalize();
    var point_on_circle_norm2 = (new THREE.Vector3().crossVectors(point_on_circle_norm, plane_normal)).normalize();
    var theta_step = 2 * Math.PI / ntriangles;
    var theta = 0;
    var points = [center.clone()];

    for (var i = 0; i < ntriangles; i++) {
        var v = new THREE.Vector3();

        // Parameterized equation of circle on a plane
        v.x = center.x + radius * Math.cos(theta) * point_on_circle_norm.x + radius * Math.sin(theta) * point_on_circle_norm2.x;
        v.y = center.y + radius * Math.cos(theta) * point_on_circle_norm.y + radius * Math.sin(theta) * point_on_circle_norm2.y;
        v.z = center.z + radius * Math.cos(theta) * point_on_circle_norm.z + radius * Math.sin(theta) * point_on_circle_norm2.z;


        points.push(v);

        theta += theta_step;
    }

    var geometry = new THREE.Geometry();

    geometry.vertices = points;

    for(var i = 0; i < ntriangles; i++) {
        geometry.faces.push(new THREE.Face3(0, i + 1, iftSafeMod(i + 1, ntriangles) + 1));
    }

    geometry.verticesNeedUpdate = true;
    return geometry;
}

function createCircleOnPlane(plane, center, radius, ntriangles) {
    // Finding a point on the circle and drawing the circle from it
    var point_on_circle = perpendicularVector(plane.normal).multiplyScalar(radius).add(center);

    return createCircleOnPlaneFromStartingPoint(plane, center, point_on_circle, ntriangles);
}

function createCylinderGivenEndpoints(p0, p1, radius, ntriangles, open_ended) {
    var cylinderLength 	= p0.distanceTo(p1);
    var cylinder 		= new THREE.CylinderGeometry(radius, radius, cylinderLength, ntriangles, ntriangles, open_ended);
    var cylinderMesh 	= new THREE.Mesh(cylinder);
    var scribbleDirection 	= new THREE.Vector3().subVectors(p0, p1).normalize();
    var axis 				= cylinderMesh.up.clone();
    var midpoint			= p0.clone().add(p1).divideScalar(2.0);

    // Rotating cylinder's up direction to match the scribble's direction
    cylinderMesh.quaternion.setFromUnitVectors(axis, scribbleDirection);
    // Translating the mesh to the midpoint between p0 and p1
    cylinderMesh.position.copy(midpoint);

    return cylinderMesh;
}

function createRectangleGivenEndpoints(p1, p0, plane, width) {
    var line_dir = new THREE.Vector3().subVectors(p1, p0);
    var plane_normal = plane.normal.clone();
    var rectVertexDirPos, rectVertexDirNeg;

    line_dir.normalize();
    plane_normal.normalize();

    // Computing the direction of the vertices that will be used to compose the rectangle
    // of the scribble between points p0 and p1. Those vertices are orthogonal to the
    // normal of the plane onto which the scribble is being drawn.
    rectVertexDirPos = line_dir.clone().cross(plane_normal).normalize().multiplyScalar(width / 2.0);
    rectVertexDirNeg = plane_normal.clone().cross(line_dir).normalize().multiplyScalar(width / 2.0);


    // Computing a rectangular scribble connecting p0 and p1
    var rectGeometry = new THREE.Geometry();
    rectGeometry.vertices.push(new THREE.Vector3().addVectors(p0, rectVertexDirPos));
    rectGeometry.vertices.push(new THREE.Vector3().addVectors(p1, rectVertexDirPos));
    rectGeometry.vertices.push(new THREE.Vector3().addVectors(p1, rectVertexDirNeg));
    rectGeometry.vertices.push(new THREE.Vector3().addVectors(p0, rectVertexDirNeg));
    rectGeometry.faces.push(new THREE.Face3(0, 1, 2));
    rectGeometry.faces.push(new THREE.Face3(0, 2, 3));

    return  rectGeometry;
}

// Code for finding intersection points from: http://asawicki.info/news_1428_finding_polygon_of_plane-aabb_intersection.html

// OutVD > 0 means segment is back-facing the plane
// returns false if there is no intersection because ray is perpedicular to plane
function segmentToPlane(seg_orig, seg_dir, plane)
{
    var OutT = 0.0;
    var eps = 0.00001;

    var OutVD = plane.normal.x * seg_dir.x + plane.normal.y * seg_dir.y + plane.normal.z * seg_dir.z;

    if (Math.abs(OutVD) <= eps)
        return [false, OutT, OutVD];

    OutT = - (plane.normal.x * seg_orig.x + plane.normal.y * seg_orig.y + plane.normal.z * seg_orig.z + plane.constant) / OutVD;

    return [true, OutT, OutVD];
}

// Calculates the points that lie in the intersection between a given plane and a bounding box.
// Maximum out_point_count == 6, so out_points must point to 6-element array.
// out_point_count == 0 mean no intersection. out_points are sorted.
function calcPointsInPlaneBoundingBoxIntersection(plane, bb_min, bb_max)
{
    var vd, t;
    var out_points = [];

    // Test edges along X axis, pointing right.
    var dir = new THREE.Vector3(bb_max.x - bb_min.x, 0.0, 0.0);
    var orig = new THREE.Vector3(bb_min.x, bb_min.y, bb_min.z);
    var res;

    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if (res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_min.x, bb_max.y, bb_min.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_min.x, bb_min.y, bb_max.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_min.x, bb_max.y, bb_max.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    // Test edges along Y axis, pointing up.
    dir = new THREE.Vector3(0.0, bb_max.y - bb_min.y, 0.0);
    orig = new THREE.Vector3(bb_min.x, bb_min.y, bb_min.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_max.x, bb_min.y, bb_min.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_min.x, bb_min.y, bb_max.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_max.x, bb_min.y, bb_max.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    // Test edges along Z axis, pointing forward.
    dir = new THREE.Vector3(0.0, 0.0, bb_max.z - bb_min.z);
    orig = new THREE.Vector3(bb_min.x, bb_min.y, bb_min.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_max.x, bb_min.y, bb_min.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_min.x, bb_max.y, bb_min.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    orig = new THREE.Vector3(bb_max.x, bb_max.y, bb_min.z);
    [res, t, vd] = segmentToPlane(orig, dir, plane);
    if(res && t >= 0.0 && t <= 1.0)
        out_points.push(new THREE.Vector3(orig.x + dir.x*t,orig.y + dir.y*t, orig.z + dir.z*t));

    if(out_points.length > 0) {
        var origin = out_points[0].clone();
        // Sorting points to ensure that they form an ordered polygon
        out_points.sort(function(lhs, rhs){
            var v = new THREE.Vector3();
            var lhsv = new THREE.Vector3();
            var rhsv = new THREE.Vector3();

            lhsv.subVectors(lhs, origin);
            rhsv.subVectors(rhs, origin);

            v.crossVectors(lhsv, rhsv);

            return v.dot(plane.normal);
        });
    }
    return out_points;
}


function updateMeshClippingPlane(mesh, visible, clippingPlane, clippingPlaneDir) {
    if(clippingPlane !== null) {
        var v = clippingPlane.normal.clone();

        var constantMult = clippingPlaneDir;
        var doClipping = true;

        // If dir == 0.0, we do not clip the mesh
        if (iftAlmostZero(clippingPlaneDir)) {
            constantMult = 1.0;
            doClipping = false;
        }

        var vInverted = v.clone().multiplyScalar(constantMult);
        var w = clippingPlane.constant;

        if (doClipping) {
            mesh.material.clippingPlanes = [new THREE.Plane(vInverted, w * constantMult)];
        } else {
            mesh.material.clippingPlanes = null;
        }

        // Allowing only the labels whose bounding box intersects the plane to be visible at any given time
        if(mesh.forceVisibility !== VISIBILITY_NEVER)
            mesh.visible = visible && (mesh.forceVisibility === VISIBILITY_ALWAYS || planeIntersectsMeshBoundingBox(clippingPlane, mesh, clippingPlaneDir));
        else
            mesh.visible = false;

    } else {
        mesh.material.clippingPlanes = null;
    }
}

function planeIntersectsMeshBoundingBox(plane, mesh, planeDir) {
    var v = plane.normal.clone();

    var constantMult = planeDir;
    var doClipping = true;

    // If planeDir == 0.0, we do not clip the mesh
    if (iftAlmostZero(planeDir)) {
        constantMult = 1.0;
        doClipping = false;
    }

    var vInverted = v.clone().multiplyScalar(constantMult);
    var w = plane.constant;

    // Allowing only the labels whose bounding box intersects the plane to be visible at any given time
    var planeInverted = new THREE.Plane(vInverted, -w * constantMult);

    return planeInverted.intersectsBox(mesh.geometry.boundingBox);
}

function createScribbleGeometry(points, radius, plane, append_single_endpoint) {
    var geometry = null;
    var ntriangles = 16;
    var add_last_circle = false;
    var sphereGeometry;
    if(points.length < 1)
        return null;
    
    var zp = points[0].z * 10;
    var xp = points[0].x * 10;
    var yp = points[0].y * 10;

    //console.log(zp, xp, yp);
    var slicen = +Math.floor(((zp+5)/10)*60 - 1);
    var slicex = +(xp+5) * 30;
    var slicey = +(yp+5) * 30;
    //console.log(slicen, slicex, slicey)
    /*
    var currentSlice = new Image();
    var thisurl = "";
    if (slicen < 10){ 
        thisurl = 'slices/raw_000' + slicen + '.jpg';}
    else { 
        thisurl = 'slices/raw_00' + slicen + '.jpg';}

    currentSlice.src =  thisurl;
    
    //base_image.onload = function(){
    context.drawImage(currentSlice, 0, 0, 350, 350 );
    */
    //How to translate 3D vector point (distance from origin) to slice???
    
    context.fillStyle = "rgba(255,100,100," + slicen/50 + ")";
    context.beginPath();
    context.arc(400 + slicex, 100 + slicey, Math.sqrt(slicen), 0,  2 * Math.PI, true);               
    context.fill();
    context.closePath();

    context.fillStyle = "rgba(255,255,0," + slicey/300 + ")";
    context.beginPath();
    context.arc(50 + slicex, slicen/60*300 + 100, Math.sqrt(slicey/5), 0,  2 * Math.PI, true);               
    context.fill();
    context.closePath();

    if(points.length === 1) {
        if(plane !== undefined && plane !== null) {
            // Adding a circle if there is only one selected point
            var circleGeometry = createCircleOnPlane(plane, p0, radius, ntriangles);

            geometry.merge(circleGeometry);
        } else {

            sphereGeometry = new THREE.SphereGeometry(radius, ntriangles, ntriangles);
            sphereGeometry.translate(points[0].x, points[0].y, points[0].z);

            geometry.merge(sphereGeometry);

        }
    } else {
        var geometry = new THREE.Geometry();

        // If parameter plane is defined and not null, then it dictates that the
        // scribble should be drawn on the corresponding plane. That parameter should be a 3D vector
        // corresponding to the plane. We also expect that the scribble points be selected on the plane.
        if (plane !== undefined && plane !== null) {

            for (var i = 0; i < points.length - 1; i++) {
                var p0 = points[i];
                var p1 = points[i + 1];

                if (!iftVoxelsAreEqual(p0, p1)) {
                    if (Math.abs(plane.distanceToPoint(p0)) <= IFT_EPSILON &&
                        Math.abs(plane.distanceToPoint(p1)) <= IFT_EPSILON) {

                        var rectGeometry = createRectangleGivenEndpoints(p1, p0, plane, 2*radius);

                        geometry.merge(rectGeometry);

                        // Creating a circle on the first endpoint
                        var circleGeometry = createCircleOnPlane(plane, p0, radius, ntriangles);

                        geometry.merge(circleGeometry);

                        add_last_circle = true;
                    } else {
                        // Issuing a warning when to neighboring points were not selected on the same plane
                        var err_msg = 'Points ' + p0 + ' ' + p1 + ' not on the 2D scribble plane ' + plane;
                        throw err_msg;
                    }
                } else {
                    // Drawing a circle if p0 and p1 are the same point
                    var circleGeometry = createCircleOnPlane(plane, p0, radius, ntriangles);

                    geometry.merge(circleGeometry);

                    add_last_circle = false;
                }
            }

            // Adding a circle on the last point of the scribble
            if (add_last_circle) {
                var circleGeometry = createCircleOnPlane(plane, points[points.length - 1], radius, ntriangles);
                geometry.merge(circleGeometry);
            }
        } else {

            for (var i = 0; i < points.length - 1; i++) {
                var p0 = points[i];
                var p1 = points[i + 1];

                // 10%-radius intersection between spheres is allowed, before switching to drawing cylinders
                if (p0.distanceTo(p1) >= radius*0.1) {
                    geometry.mergeMesh(createCylinderGivenEndpoints(p0, p1, radius, ntriangles, true));
                } else {
                    var sphereGeometry = new THREE.SphereGeometry(radius, ntriangles, ntriangles);
                    sphereGeometry.translate(p0.x, p0.y, p0.z);
                    geometry.merge(sphereGeometry);
                }
            }

            // // Adding one sphere at either end of the scribble
            if (!iftVoxelsAreEqual(points[0], points[points.length-1])) {
                if(!append_single_endpoint) {
                    sphereGeometry = new THREE.SphereGeometry(radius, ntriangles, ntriangles);
                    sphereGeometry.translate(points[0].x, points[0].y, points[0].z);
                    geometry.merge(sphereGeometry);
                }

                sphereGeometry = new THREE.SphereGeometry(radius, ntriangles, ntriangles);
                sphereGeometry.translate(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z);

                geometry.merge(sphereGeometry);
            }
        }
    }

    var buf_geometry = new THREE.BufferGeometry().fromGeometry(geometry);

    buf_geometry.computeBoundingBox();
    return buf_geometry;
}

