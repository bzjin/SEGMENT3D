const MOUSE_MAIN_BUTTON             = 0;
const MOUSE_SEC_BUTTON              = 2;

const NORMAL_ANGLE_VISIB_TOLERANCE = 0.005;

function MouseInfo(mousePos) {
    this.mouse_pos = null;

    if(mousePos !== null)
        this.mouse_pos = mousePos.clone();

    this.world_coords = null;
}

MouseInfo.prototype.clone = function() {
    var cpy = new MouseInfo(this.mouse_pos);

    cpy.world_coords = this.world_coords !== null ? this.world_coords.clone() : null;

    return cpy;
};

// Compares if two planes are similar, irrespective to the orientation of their normal vector
function parallelPlanes(plane0, plane1, normal_angle_tolerance) {
    return 1.0 - Math.abs(plane0.normal.dot(plane1.normal)) <= normal_angle_tolerance;
}

function similarPlanes(plane0, plane1, normal_angle_tolerance, planeDist_tolerance) {
    return parallelPlanes(plane0, plane1, normal_angle_tolerance)
            && Math.abs(plane0.constant - plane1.constant) <= planeDist_tolerance;
}

function Scribble(radius, label, mk_id, plane, scribble3D, creation_timestamp) {
    this.points = [];
    this.point_index  = [];
    this.meshes = [];
    this.radius = radius;
    this.label 	= label;
    this.mk_id  = mk_id;
    this.plane  = (plane !== undefined && plane !== null) ? plane.clone() : null;
    // Timestamp to indicate when a marker was created. THE TIMESTAMP MUST NEVER BE DECREASED/CHANGED. It serves to identify
    // a scribble even when its marker ID is changed after merging
    this.creation_timestamp = creation_timestamp;
    this.scribble3D = scribble3D;
    this.forceVisibility = VISIBILITY_CUSTOM;
}

Scribble.prototype.clone = function(copy_meshes) {
    var i;
    var S = new Scribble(this.radius, this.label, this.mk_id, this.plane, this.scribble3D, this.creation_timestamp);

    copy_meshes = (copy_meshes === undefined || copy_meshes === null) ? false : copy_meshes;

    S.forceVisibility = this.forceVisibility;
    S.points = [];
    S.meshes = [];

    for(i = 0; i < this.points.length; i++) {
        S.points.push(this.points[i].clone());
    }

    for(i = 0; i < this.point_index.length; i++) {
        S.point_index.push(this.point_index[i].slice());
    }

    if(copy_meshes) {
        for (i = 0; i < this.meshes.length; i++) {
            S.meshes.push(this.meshes[i].clone());
        }
    }

    return S;
};

Scribble.prototype.setLabel = function(label) {
    this.label = label;
};

Scribble.prototype.setMarkerID = function(mk_id) {
    this.mk_id = mk_id;
};

Scribble.prototype.add = function(p0, p1) {
    var idx0, idx1;

    if(this.points.length === 0) {
        idx0 = 0;
        idx1 = 1;
        this.points.push(p0.clone(), p1.clone());
    } else {
        idx0 = this.points.length - 1;
        // Adding p0 only if it is different from the previous point, in which case the scribble might be composed
        // of non-sequential segments
        if(!p0.world_coords.equals(this.points[this.points.length - 1].world_coords)) {
            this.points.push(p0.clone());
            // Updating the idx0 since a new point unrelated to the last one was added
            idx0++;
        }

        this.points.push(p1.clone());
        idx1 = this.points.length - 1;
    }


    var n = this.points.length;

    this.meshes.push(this.createMeshBetweenPoints(this.points[n - 2], this.points[n - 1], n === 2));

    // Storing the pairs of indices
    this.point_index.push([idx0, idx1]);
};

Scribble.prototype.addLatestMeshToScene = function (scene, color) {
    var i = this.meshes.length - 1;
    if(i >= 0) {
        this.meshes[i].material.color.set(color);
        scene.remove(this.meshes[i]);
        scene.add(this.meshes[i]);
    }
};

Scribble.prototype.addMeshesToScene = function(scene, color) {
    for(var i = 0; i < this.meshes.length; i++) {
        this.meshes[i].material.color.set(color);
        scene.remove(this.meshes[i]);
        scene.add(this.meshes[i]);
    }
};

Scribble.prototype.clearMeshes = function(scene) {
    for(var i = 0; i < this.meshes.length; i++) {
        if(scene !== undefined && scene !== null)
            scene.remove(this.meshes[i]);
        this.meshes[i].geometry.dispose();
        this.meshes[i].material.dispose();
    }

    this.meshes = [];
};

Scribble.prototype.updateMeshes = function (visible, clippingPlane, curViewPlane, color, normal_angle_visib_tolerance,
                                            planeDist_visib_tolerance) {
    normal_angle_visib_tolerance   = normal_angle_visib_tolerance === undefined ? NORMAL_ANGLE_VISIB_TOLERANCE : normal_angle_visib_tolerance;
    planeDist_visib_tolerance     = planeDist_visib_tolerance === undefined ? 0.0 : planeDist_visib_tolerance;


    /* The scribbles are visible if:
     1) The user allows them to be visible
     2) The current clipping plane overlaps with them (considering given tolerances to disparity between the angle of the
     normals and the distance between the plane constants) -- for 2D scribbles only
     3) The viewing plane is positive w.r.t. the clipping plane (i.e., we cannot see the scribbles
     from behind the box -- for 2D and 3D
     */
    if(this.forceVisibility !== VISIBILITY_NEVER) {
        if (clippingPlane !== null)
            visible = visible && (this.forceVisibility === VISIBILITY_ALWAYS || curViewPlane.normal.dot(clippingPlane.normal) >= 0);

        // For 2D scribbles, we verify if the current
        if (visible && !this.scribble3D && this.plane !== null && clippingPlane !== null)
            visible = visible && (this.forceVisibility === VISIBILITY_ALWAYS || similarPlanes(this.plane, clippingPlane, normal_angle_visib_tolerance,
                    planeDist_visib_tolerance));
    } else {
        visible = false;
    }

    for(var i = 0; i < this.meshes.length; i++) {
        this.meshes[i].material.color.set(color);
        this.meshes[i].visible 	        = visible;
        this.meshes[i].forceVisibility  = this.forceVisibility;

        // Clipping 3D scribbles if and only if they are not forced to be visible
        if(visible && clippingPlane !== null) {
            var clippingPlaneDir = CLIPPING_PLANE_DIR_BOTH;

            updateMeshClippingPlane(this.meshes[i], visible, this.forceVisibility === VISIBILITY_ALWAYS ? null : clippingPlane, clippingPlaneDir);

            // Making the scribble mesh visible if it is behind the clipping plane and if its label is intersected
            // by the plane
            var position = this.points[this.point_index[i][1]].world_coords;
            var dist = clippingPlane.distanceToPoint(position);

            if(dist >= 0) {
                // var K = 6;
                // Setting opacity to give some sense of depth
                var max_dist = 1.0 / 2.0;
                //var colorscale = d3.scaleLinear()
                                //.domain([0, ])
                                //.range(["#fff7bc","#662506"])
                // If delineation occurred, we only let the scribbles from labels intersected by the clipping plane
                // to be visible
                if(coseGUI.meshLabels.length > 0) {
                    var idx = findLabelIndex(coseGUI.meshLabels, this.label);

                    if (idx >= 0) {
                        this.meshes[i].visible = this.forceVisibility !== VISIBILITY_NEVER && planeIntersectsMeshBoundingBox(clippingPlane, coseGUI.meshLabels[idx],
                                                                            clippingPlaneDir);

                        this.meshes[i].material.transparent = true;
                        //this.meshes[i].material.opacity = 1.0;
                         var K = 8;
                        //this.meshes[i].material.color.setHex(colorscale(Math.exp(-K*Math.abs(dist) / (max_dist))));
                        this.meshes[i].material.opacity = Math.exp(-K*Math.abs(dist) / (max_dist));
                        // this.meshes[i].material.opacity = 0.5;
                        //this.meshes[i].material.wireframe = Math.exp(-K*Math.abs(dist) / (max_dist)) < 0.5;
                        // this.meshes[i].material.wireframe = true;
                   }
                } else {
                    // Otherwise, all scribbles behind the plane become visible with a certain opacity
                    // Setting a higher K to make scribbles that are further away less visible

                    this.meshes[i].visible = this.forceVisibility !== VISIBILITY_NEVER && Math.abs(dist) <= this.radius*2;
                    // this.meshes[i].visible = this.forceVisibility !== VISIBILITY_NEVER;
                    this.meshes[i].material.transparent = true;
                    this.meshes[i].material.opacity = 1.0;

                    // this.meshes[i].material.opacity = Math.exp(-K*Math.abs(dist) / (max_dist));
                    // this.meshes[i].material.wireframe = true;
                }
            }
        }
    }
};

Scribble.prototype.createMeshBetweenPoints = function (prevMouseInfo, nextMouseInfo, append_single_endpoint) {
    var scribbleGeometry = createScribbleGeometry([prevMouseInfo.world_coords, nextMouseInfo.world_coords], this.radius, (this.scribble3D) ? null : this.plane,
                                                    append_single_endpoint);
    var material 		 = new THREE.MeshPhongMaterial({side: THREE.FrontSide,
                                                    transparent: true,
                                                    opacity: 1.0,
                                                    //combine: THREE.MixOperation,
                                                    clippingPlanes: null,
                                                    shading: THREE.SmoothShading
                                                });

    return new THREE.Mesh(scribbleGeometry, material);
};

Scribble.prototype.createMeshes = function(scene) {
    this.clearMeshes(scene);

    for (var i = 0; i < this.point_index.length; i++) {
        this.meshes.push(this.createMeshBetweenPoints(this.points[this.point_index[i][0]], this.points[this.point_index[i][1]], i === 0 && this.point_index.length === 2));
    }
};

Scribble.prototype.closestScribblePositionToPoint = function(point_world) {
    var closest = null;
    var min_d = IFT_INFINITY_DBL;

    for(var i = 0; i < this.points.length; i++) {
        var d = point_world.distanceTo(this.points[i].world_coords);

        if(d < min_d) {
            closest = this.points[i].world_coords.clone();
            min_d = d;
        }
    }

    return closest;
};

// // Converts the set of points into image coordinates
// function worldCoordsToImageCoords(world_coords, center, maxDimension) {
//     var v = world_coords.clone();
//     v.y *= -1; // Inverting the y coordinate to match the image's coordinate system
//
//     return v.add(center).multiplyScalar(maxDimension).round();
// }

// // IMPORTANT: we accept maxDimension as a parameter to make this function more general, since we use it in marchingCubes
// // to compute the meshes in an image with a frame around it
// function imageCoordsToWorldCoords(coords, center_float, maxDimension) {
//     return new THREE.Vector3((coords.x - center_float.x) / maxDimension, (center_float.y - coords.y) / maxDimension,
//                             (coords.z - center_float.z) / maxDimension );
// }

Scribble.prototype.pointWorldCoordToImageCoords = function (img) {
    var pointsImg = [];
    var center = img.getBoxCenter();

    for(var i = 0; i < this.points.length; i++) {
        var v = img.worldCoordsToImageCoords(this.points[i].world_coords, center);

        pointsImg.push( v );
    }

    return pointsImg;
};

Scribble.prototype.scribblePointsToVoxels = function (img_data, selectedVoxels, tolerance_dist) {
    var A = null;
    var pointsImg;
    var voxels = [];

    // If the image is 3D, then the scribble might either have been drawn in 3D or on a 2D surface (plane) of it
    if(iftIs3DImage(img_data.img)) {
        if (this.scribble3D) {
            A = iftSpheric(img_data.worldDimensionToImageDimension(this.radius));
        } else {
            A = iftCircularOnPlane(img_data.worldDimensionToImageDimension(this.radius), this.plane, tolerance_dist);
        }
    } else {
        // Otherwise, we simply draw a 2D circular adjacency
        A = iftCircular(img_data.worldDimensionToImageDimension(this.radius));
    }

    // Converting the points back to image coordinates
    pointsImg = this.pointWorldCoordToImageCoords(img_data);

    var overlapping_labels = [];

    for (var i = 0; i < this.point_index.length; i++) {
        var new_overlapping_labels = this.drawScribbleVoxels(img_data.img, selectedVoxels, pointsImg[this.point_index[i][0]],
                                                            pointsImg[this.point_index[i][1]],
                                                            A, voxels);

        overlapping_labels = overlapping_labels.concat(new_overlapping_labels);
    }

    return {voxels: voxels, overlapping_labels: overlapping_labels};
};

Scribble.prototype.drawScribbleVoxelsInAdjacency = function (img, selectedVoxels, A, u, voxels) {
    var overlapping_labels = [];
    var this_label_included = false;

    for (var i = 0; i < A.n; i++) {
        var v = iftGetAdjacentVoxel(A, u, i);

        if (iftValidVoxel(img, v)) {
            var p = iftGetVoxelIndex(img, v);

            // Selecting only unselected voxels
            if(selectedVoxels.val[p] < 0) {
                voxels.push({elem: v, label: this.label, marker: this.mk_id} );
                // Marking voxel as selected
                selectedVoxels.val[p] = this.label;
            } else {
                if(this.label !== selectedVoxels.val[p]) {

                    overlapping_labels.push(selectedVoxels.val[p]);
                    if(!this_label_included) {
                        overlapping_labels.push(this.label);
                        this_label_included = true;
                    }
                }
            }
        }
    }

    return overlapping_labels;
};

Scribble.prototype.drawScribbleVoxels = function (img, selectedVoxels, p0, p1, A, voxels) {
    var phalf = new THREE.Vector3().addVectors(p0, p1).divideScalar(2.0).floor();

    var new_overlapping_labels0;
    var new_overlapping_labels1;

    if(iftVoxelsAreEqual(phalf, p0) || iftVoxelsAreEqual(phalf, p1)) {
        new_overlapping_labels0 = this.drawScribbleVoxelsInAdjacency(img, selectedVoxels, A, p0, voxels);
        new_overlapping_labels1 = this.drawScribbleVoxelsInAdjacency(img, selectedVoxels, A, p1, voxels);
    } else {
        new_overlapping_labels0 = this.drawScribbleVoxels(img, selectedVoxels, p0, phalf, A, voxels);
        new_overlapping_labels1 = this.drawScribbleVoxels(img, selectedVoxels, phalf, p1, A, voxels);
    }

    return new_overlapping_labels0.concat(new_overlapping_labels1);
};


function mousePositionToRelativePosition(event, canvas) {
    var w = canvas.clientWidth;

    var h = canvas.clientHeight;

    return new THREE.Vector2(((event.offsetX) / w) * 2 - 1, -(event.offsetY / h) * 2 + 1);
}

// Ugly hack to convert the mouse's position into world coordinates
function intersectMousePositionAndClippingPlane(mousePos, camera, plane) {
    var mouseInfo = null;

    var raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(mousePos, camera);

    // Verifying
    if (plane !== undefined && plane !== null) {
        var intersection_point = new THREE.Vector3();

        var intersects = raycaster.ray.intersectPlane(plane, intersection_point);
        if (intersects) {
            mouseInfo = new MouseInfo(mousePos);

            mouseInfo.world_coords = intersection_point;
        }
    }

    return mouseInfo;
}

// Ugly hack to convert the mouse's position into world coordinates
function intersectMousePositionMeshes(mousePos, camera, meshes, label) {
    var mouseInfo = null;
    var min_dist = IFT_INFINITY_DBL;
    var raycaster = new THREE.Raycaster();
    var selLabel = -1;
    var idx =  -1;

    raycaster.setFromCamera(mousePos, camera);

    // Verifying
    if (meshes.length > 0) {
        var intersection_point = new THREE.Vector3();

        var intersects = raycaster.intersectObjects(meshes, intersection_point);

        if (intersects.length > 0) {

            if(label !== undefined && label !== null && label >= 0) {
                // Looking for the intersection with the given label
                for(var i = 0; i < intersects.length && idx < 0; i++) {
                    if(intersects[i].object.label === label) {
                        idx = i;
                        min_dist = intersects[i].distance;
                    }
                }
            } else {
                // Getting the intersection with the closest mesh
                idx = 0;
            }

            if(idx >= 0) {
                mouseInfo = new MouseInfo(mousePos);

                mouseInfo.world_coords = intersects[idx].point.clone();
                min_dist = intersects[idx].distance;
                selLabel = intersects[idx].object.label;
            }
        }
    }

    return {mouseInfo: mouseInfo, distance: min_dist, label: selLabel, index: idx};
}


const SCRIBBLE_MANAGER_MODE_ADD     = 0;
const SCRIBBLE_MANAGER_MODE_DEL     = 1;
const SCRIBBLE_MANAGER_MODE_MERGE   = 2;
const SCRIBBLE_MANAGER_MODE_SPLIT   = 3;
const SCRIBBLE_MANAGER_MODE_EXTEND  = 4;

const SCRIBBLE_SELECTION_BY_MARKER_ID    = 0;
const SCRIBBLE_SELECTION_BY_LABEL        = 1;
const SCRIBBLE_SELECTION_BY_TIMESTAMP    = 2;

/**
 *
 * @param img Image onto which the scribble will be drawn (used only to determine the coordinates).
 * @param radius The scribble radius should be in voxels
 * @param scribble3D If true, the scribble is drawn in 3D
 * @param colormap The colormap used to colorthe scribble
 * @param mode The default mode of operation
 * @param onFinishedAddingScribble Function called after the scribble is added. It may be null.
 * @constructor
 */
function ScribbleManager(img, radius, scribble3D, colormap, mode, onFinishedAddingScribble) {
    this.__onFinishedAddingScribble = onFinishedAddingScribble;
    this.__active = false;

    // This ID must not be reset even when all scribbles are removed
    this.__next_creation_timestamp = 1;

    this.__adj_tolerance_dist   = 0.5;  // Tolerance used to select voxels on arbitrary planes given a circular
                                        // adjacency selected on it
    this.scribble_collection     = [];

    this.__scribbles_to_remove = [];
    // Clearing/initializing some attributes
    this.clearHandler(null);

    numInteractions         = 0; // TODO: remove. Counts the number of interactions

    this.stopModes();
    this.setMode(mode);
    this.setImage(img);
    this.setRadius(radius);
    this.setScribble3D(scribble3D);
    this.setColormap(colormap); //[purple, yellow]
}

ScribbleManager.prototype.clearHandler = function(scene) {

    this.clearScribbleCollection(scene);
    this.clearScribblesSelectedForRemoval(scene);
    this.scribble_collection = [];
    this.__scribbles_to_remove = [];

    this.__new_scribble = null;
    this.__prevMouseInfo = null;

    this.__max_label = 0; // Reinitializing the maximum added label
    this.__addBkgScribble   = false;
    this.__label_to_modify = -1;
    this.__num_scribbles_added_for_splitting = 0;

    this.setMarkerID(0);
    this.setLabel(0);
    this.setCmdKey(false);
    this.setShiftKey(false);
    this.setImage(null);

    this.state_machine = new ScribbleManagerStateMachine(this);
};


ScribbleManager.prototype.clearScribbleCollection = function(scene) {
    if(scene !== null) {
        for (var i = 0; i < this.scribble_collection.length; i++) {
            //console.log(this.scribble_collection)
            this.scribble_collection[i].clearMeshes(scene);
        }
    }

    context.clearRect(0, 100, 306, 350);
    allScribbles = [];
    for (i=0; i<60; i++){
        allScribbles.push({"slice": i, "scribbles": []})
    }

    mapctx.clearRect(230, 0, 20, 200);

    context.lineWidth="5";
    context.strokeStyle = colory;
    context.fillStyle = 'black';
    context.fillRect(x2, 125, 250, 250);
    context.strokeRect(x2-3, 122, 256, 256);
   
    context.lineWidth="1";
    context.strokeStyle = 'white';
};

ScribbleManager.prototype.clearScribblesSelectedForRemoval = function(scene) {
    if(scene !== null) {
        for (var i = 0; i < this.__scribbles_to_remove.length; i++) {
            this.__scribbles_to_remove[i].clearMeshes(scene);
        }
        this.__scribbles_to_remove = [];
    }
};


ScribbleManager.prototype.setRadius = function(radius) {
    this.__radius = radius;
};

ScribbleManager.prototype.setImage = function(img) {
    this.__img   = img;

    this.__selectedVoxels = null;
    if(img !== null) {
        // Label map used to flag voxels that have already been selected, and also to determine
        // when scribbles with different labels overlap
        this.__selectedVoxels = iftCreateImage(this.__img.img.xsize, this.__img.img.ysize, this.__img.img.zsize);
    }
};

ScribbleManager.prototype.setLabel = function(label) {
    this.__label = label;

    // Keeping track of the maximum label that was added
    this.__max_label = Math.max(this.__max_label, label);
};

ScribbleManager.prototype.setMarkerID = function(mk_id) {
    this.mk_id = mk_id;
};

ScribbleManager.prototype.setShiftKey = function (value) {
    this.__shiftKey = value;

    // Using shift key to add background scribble scribble
    this.__addBkgScribble = this.__shiftKey;
};

ScribbleManager.prototype.setCmdKey = function (value) {
    this.__cmdKey = value;
};

ScribbleManager.prototype.setScribble3D = function (value) {
    this.__scribble3D = value;
};

ScribbleManager.prototype.setColormap = function(colormap) {
    this.__colormap = colormap;
};

ScribbleManager.prototype.setMode = function(mode) {
    switch(mode) {
        default:
        case SCRIBBLE_MANAGER_MODE_ADD:
            this.__mode = mode;
            break;
        case SCRIBBLE_MANAGER_MODE_DEL:
            this.__mode = mode;
            break;
        case SCRIBBLE_MANAGER_MODE_MERGE:
            this.__mode = mode;
            break;
        case SCRIBBLE_MANAGER_MODE_SPLIT:
            this.__mode = mode;
            break;
        case SCRIBBLE_MANAGER_MODE_EXTEND:
            this.__mode = mode;
            break;
    }
};

ScribbleManager.prototype.getMode = function() {
    return this.__mode;
};


ScribbleManager.prototype.start = function(container) {
    this.__active = true;

    container.addEventListener('mousemove', this, false);
    container.addEventListener('mousedown', this, false);
    container.addEventListener('mouseup', this, false);
    container.addEventListener('wheel', this, false);

    // Resetting key commands
    this.setCmdKey(false);
    this.setShiftKey(false);
};

ScribbleManager.prototype.stop = function(container) {
    this.__active = false;

    this.stopModes();

    container.removeEventListener('mousemove', this, false);
    container.removeEventListener('mousedown', this, false);
    container.removeEventListener('mouseup', this, false);
    container.removeEventListener('wheel', this, false);
};

/*
 *  Methods for handling mouse events
 */

// Function necessary to avoid 'this' referring to the event handler when passing the methods, instead of
// the object represented by the ScribbleManager object. JS is poorly designed.... I hate it....
ScribbleManager.prototype.handleEvent = function (event) {
    if(!this.__active)
        return;

    switch(event.type) {
        case 'mousedown':
            this.mouseDown(event);
            break;
        case 'mousemove':
            this.mouseMove(event);
            break;
        case 'mouseup':
            this.mouseUp(event);
            break;
        case 'wheel':
            this.mouseWheel(event);
            break;
        default:
            break;
    }
};

ScribbleManager.prototype.mouseDown = function (event) {
    if(!this.__active)
        return;

    if(this.__cmdKey) {
        this.focusOnLabel(event);
    } else {
        switch (this.__mode) {
            case SCRIBBLE_MANAGER_MODE_MERGE:
            case SCRIBBLE_MANAGER_MODE_EXTEND:
            case SCRIBBLE_MANAGER_MODE_ADD:
                this.newClickAdd(event);
                break;
            case SCRIBBLE_MANAGER_MODE_DEL:
                this.newClickDel(event);
                break;
            case SCRIBBLE_MANAGER_MODE_SPLIT:
                this.newClickSplit(event);
                break;
            default:
        }
    }
};

ScribbleManager.prototype.mouseMove = function(event) {
    if(!this.__active)
        return;

    switch(this.__mode) {
        case SCRIBBLE_MANAGER_MODE_MERGE:
        case SCRIBBLE_MANAGER_MODE_EXTEND:
        case SCRIBBLE_MANAGER_MODE_SPLIT:
        case SCRIBBLE_MANAGER_MODE_ADD:
            this.drawScribble(event);
            break;
        default:
    }
};

ScribbleManager.prototype.mouseUp = function(event) {
    if(!this.__active)
        return;

    switch(this.__mode) {
        case SCRIBBLE_MANAGER_MODE_MERGE:
        case SCRIBBLE_MANAGER_MODE_EXTEND:
        case SCRIBBLE_MANAGER_MODE_ADD:
            this.finishDrawingScribble(event);
            break;
        case SCRIBBLE_MANAGER_MODE_DEL:
            this.finishDeletingScribble();
            break;
        case SCRIBBLE_MANAGER_MODE_SPLIT:
            this.finishDrawingScribbleSplit(event);
            break;
        default:
    }
};


ScribbleManager.prototype.mouseWheel = function( event ) {

    if ( !this.__active )
        return;

    if(guiParams.curModel !== null) {
        var direction = (event.deltaY < 0) ? 1 : -1;
        var delta = currentImage.getVoxelWorldSize();

        if (direction > 0) {
            guiParams.planeDist = Math.min(1.0, guiParams.planeDist + delta);
        } else {
            guiParams.planeDist = Math.max(-1.0, guiParams.planeDist - delta);
        }
    }
};

ScribbleManager.prototype.loadScribblesFromJson = function(json) {
    if(!this.__active)
        return;

    var center          = getImageCenterFloat(this.__img.img);
    var max_lb = IFT_NIL;

    // Ensuring that each scribble will be independently added, unless they overlap with existing scribbles
    this.setMode(SCRIBBLE_MANAGER_MODE_ADD);

    for(var i = 0; i < json.elem.length; i++) {
        var p           = json.elem[i];
        // If the seed is on the border of the region, we select a radius of 1.0 to depict it
        var radius      = !iftAlmostZero(json.radius[i])? json.radius[i] : 1.0;
        var label       = json.label[i];
        var p_coords    = iftGetVoxelCoord(this.__img.img, p);
        var p_world     = this.__img.imageCoordsToWorldCoords(p_coords, center);
        var p_mouse     = new MouseInfo(null);

        // Creating a mouse info and assigning the seed's world coordinates to it
        p_mouse.world_coords = p_world;

        // TODO: change this behavior. For simplicity, each newly added seed is assumed to be a new marker.
        this.setMarkerID(this.mk_id + 1);
        this.setLabel(label);
        this.setRadius(radius);

        max_lb = Math.max(max_lb, this.__label);

        // TODO: change this behavior. For simplicity, we assume that all loaded scribbles are 3D.
        this.setScribble3D(true);
        this.newScribble(null);

        this.appendPointsToNewScribble(p_mouse, p_mouse);

        this.addNewScribbleToCollection(false, null, true);
    }

    // Ensuring that the last selected label be the one with highest value, since new scribbles will be added afterwards
    this.setLabel(max_lb);

    this.__new_scribble      = null;
    this.__prevMouseInfo    = null;
};

/*
 * Methods for creating/drawing scribbles
 */
ScribbleManager.prototype.newClickAdd = function (event) {
    var new_lb = -1;

    if(!this.__active)
        return;

    if (event.button === MOUSE_MAIN_BUTTON) {
        if (this.__prevMouseInfo === null) {
            this.__prevMouseInfo = intersectMousePositionAndClippingPlane(mousePositionToRelativePosition(event, renderer.domElement),
                                                                            coseGUI.camera, coseGUI.clippingPlane);

            if (this.__prevMouseInfo !== null && !iftVoxelInBoundingBox(this.__img.bb_world, this.__prevMouseInfo.world_coords)) {
                this.__prevMouseInfo = null;
            } else {

                if (this.__addBkgScribble) {
                    // Adding a background label
                    this.setLabel(0);
                } else {
                    // Adding a new object for each click, by increasing the maximum label
                    this.setLabel(this.__max_label + 1);
                }

                if(this.__mode === SCRIBBLE_MANAGER_MODE_EXTEND) {
                    this.__label_to_modify = this.selectLabelUnderMousePosition(this.__prevMouseInfo.world_coords);
                }

                this.setMarkerID(this.mk_id + 1);

                new_lb = this.__label;
                this.newScribble(coseGUI.clippingPlane);
            }
        }
    }

    return new_lb;
};

ScribbleManager.prototype.newScribble = function(clippingPlane) {
    this.__new_scribble = new Scribble(this.__img.imageDimensionToWorldDimension(this.__radius), this.__label, this.mk_id, clippingPlane, this.__scribble3D, this.__next_creation_timestamp++);
};

ScribbleManager.prototype.drawScribble = function(event) {
    if(!this.__active)
        return;

    if(event.button === MOUSE_MAIN_BUTTON && (this.__label !== 0 || this.__addBkgScribble)) {
        var curMouseInfo = intersectMousePositionAndClippingPlane(mousePositionToRelativePosition(event, renderer.domElement),
            coseGUI.camera, coseGUI.clippingPlane);

        if (this.__prevMouseInfo !== null && curMouseInfo !== null) {

            if (!iftVoxelInBoundingBox(this.__img.bb_world, curMouseInfo.world_coords)) {
                // Adding new scribble to collection if the mouse moves away from the image
                var new_label = this.addNewScribbleToCollection(true, this.__img.label, true);

                if(guiParams.overlay === LABEL_MESH_OVERLAY && guiParams.selLabels[0] > 0) {
                    coseGUI.selectLabelsForDisplay([new_label], false);
                }
            } else {

                this.appendPointsToNewScribble(this.__prevMouseInfo, curMouseInfo);

                this.__prevMouseInfo = curMouseInfo;
            }
        }
    }
};

ScribbleManager.prototype.finishDrawingScribble = function(event) {
    if(!this.__active)
        return;

    if(event.button === MOUSE_MAIN_BUTTON) {
        var curMouseInfo = intersectMousePositionAndClippingPlane(mousePositionToRelativePosition(event, renderer.domElement),
                                                                                                    coseGUI.camera, coseGUI.clippingPlane);

        if (this.__prevMouseInfo !== null) {
            if (curMouseInfo !== null && iftVoxelInBoundingBox(this.__img.bb_world, curMouseInfo.world_coords)) {
                this.appendPointsToNewScribble(this.__prevMouseInfo, curMouseInfo);
            }

            var new_label = this.addNewScribbleToCollection(true, this.__img.label, true);

            // If a given label was selected for rendition, we update it to display the newly added label
            if(guiParams.overlay === LABEL_MESH_OVERLAY && guiParams.selLabels[0] > 0) {
                coseGUI.selectLabelsForDisplay([new_label], false);
            }
        }

        this.__prevMouseInfo = null;
        this.__new_scribble = null;
    }
};

ScribbleManager.prototype.appendPointsToNewScribble = function(p0, p1) {
    this.__new_scribble.add(p0, p1);

    var lb = this.__new_scribble.label;
    var color = this.__colormap.getColor(lb);

    this.__new_scribble.addLatestMeshToScene(coseGUI.getScene(), color);
};

ScribbleManager.prototype.addNewScribbleToCollection = function (call_finished_processing_func, label_img, save_state) {
    var selected_label = -1;

    // Adding a new scribble to the collection even if the mouse up event occurred outside the image
    if (this.__new_scribble !== null) {
        // Extending the new scribble to connect it with the scribble from the label selected to be extended, before
        // evaluating if the new scribble overlaps with other labels (or scribbles from those labels) that must be merged
        if(this.__mode === SCRIBBLE_MANAGER_MODE_EXTEND) {
            this.connectNewScribbleWithOldScribbles([this.__label_to_modify]);
        }

        // Adding the new scribble to the collection, to ensure that the new scribble will be evaluated when merging labels
        this.scribble_collection.push(this.__new_scribble);

        // Determining the scribbles that overlap and solving this problem by merging two or more of them
        // according to a relabelling criterion. The scribblesToSeeds function already determine
        // the ones that overlap
        var res = this.scribblesToSeeds(IFT_NIL, IFT_INFINITY_INT);

        // Copying the labels of that overlap
        var overlapping_labels = res.overlapping_labels.slice();

        // Adding the label of the new scribble for merging. Technically, it is already included but we double check
        // to make sure
        if(overlapping_labels.indexOf(this.__new_scribble.label) < 0) {
            overlapping_labels.push(this.__new_scribble.label);
        }

        // Selecting all labels under the new scribble for merging, regardless of whther the new scribble intersects
        // with them or not. The scribbles from underlying labels are connected to the new scribble to ensure that
        // each label has only a single connected component of scribbles
        if(this.__mode === SCRIBBLE_MANAGER_MODE_MERGE) {
            var i;
            // Finding the labels under the new scribble, regardless of whether the scribbles intersect or not
            var new_scribble_seeds = this.scribblesToSeeds(this.__new_scribble.mk_id-1, this.__new_scribble.mk_id);

            var labels_under_scribble = this.labelsUnderSeeds(new_scribble_seeds.seeds, label_img);
            var unconnected_scribble_labels = [];

            // Copying the labels under the selected seeds that were already not in overlapping_labels.
            // We also keep them in a separate list to connect their scribbles with the newly added scribble.
            for(i = 0; i < labels_under_scribble.length; i++) {
                if(overlapping_labels.indexOf(labels_under_scribble[i]) < 0) {
                    overlapping_labels.push(labels_under_scribble[i]);

                    unconnected_scribble_labels.push(labels_under_scribble[i]);
                }
            }

            this.connectNewScribbleWithOldScribbles(unconnected_scribble_labels);
        }

        // For most operation modes that require scribble overlap resolution (i.e., merging and/or adding that results into
        // merging or extension), the lowest valued label is used for to resolve the conflict
        selected_label = Math.min.apply(null, overlapping_labels);

        // For extension mode, the label that was previously selected by the user with the (first click) of current
        // scribble is used instead. Note that this can be easily changed to the label onto which the user released
        // the mouse click
        if(this.__mode === SCRIBBLE_MANAGER_MODE_EXTEND) {
            // If a non-negative label was selected for extension, we use that label to resolve scribble overlap.
            // The label to extend is then reset to -1
            if (this.__label_to_modify >= 0) {
                selected_label = this.__label_to_modify;
            }
            this.__label_to_modify = -1;
        }

        // Saving the state *before* resolving scribble overlap, since the state must be saved before any
        // modifications are made to the existing scribbles (i.e., before modifying their label and marker ID)
        if(save_state) {
            this.state_machine.addState(SCRIBBLE_MANAGER_MODE_ADD, overlapping_labels, selected_label, SCRIBBLE_SELECTION_BY_LABEL);
        }

        // We resolve the scribble overlap problem here, since we want the delineation algorithm
        // to receive clean data. Moreover, each scribble keeps its label and marker ID and we would
        // have to update that information anyway.
        this.resolveScribbleOverlap(overlapping_labels, selected_label);

        this.__new_scribble      = null;
        this.__prevMouseInfo    = null;
    }

    if(call_finished_processing_func)
        this.callFinishProcessingFunc();

    return selected_label;
};

ScribbleManager.prototype.callFinishProcessingFunc = function() {
    if (this.__onFinishedAddingScribble !== undefined && this.__onFinishedAddingScribble !== null) {

        this.__onFinishedAddingScribble();
    }
};

ScribbleManager.prototype.connectNewScribbleWithOldScribbles = function(unconnected_scribble_labels) {
    // Connecting scribbles of labels that will be merged that have not already been linked interactively
    // by the user (i.e., adding new points to this.__new_scribble to connect it to the other scribbles)
    for (i = 0; i < unconnected_scribble_labels.length; i++) {
        var lb = unconnected_scribble_labels[i];
        var min_dist = IFT_INFINITY_DBL;
        var scribble_pt = null;
        var closest_pt = null;
        var mouseInfo0 = new MouseInfo(null);
        var mouseInfo1 = new MouseInfo(null);

        // Finding the closest scribble point of the unconnected label to the current scribble
        for (j = 0; j < this.__new_scribble.points.length; j++) {
            var res = this.closestScribblePositionToPoint(this.__new_scribble.points[j].world_coords, lb);

            if (res.distance < min_dist) {
                closest_pt = res.point.clone();
                min_dist = res.distance;
                scribble_pt = this.__new_scribble.points[j].world_coords.clone();
            }
        }

        // Appending a pair of points to the new scribble to connect it to the scribble of the other label
        mouseInfo0.world_coords = scribble_pt;
        mouseInfo1.world_coords = closest_pt;

        this.appendPointsToNewScribble(mouseInfo0, mouseInfo1);
    }
};


ScribbleManager.prototype.labelsUnderSeeds = function(seeds, label) {
    var selected_labels = [];

    for(var i = 0; i < seeds.length; i++) {
        if(iftValidVoxel(label, seeds[i].elem)) {
            var p = iftGetVoxelIndex(label, seeds[i].elem);
            var lb = label.val[p];

            if (selected_labels.indexOf(lb) < 0) {
                selected_labels.push(lb);
            }
        }
    }

    return selected_labels;
};

ScribbleManager.prototype.selectLabelUnderMousePosition = function(world_coords)
{
    var center = this.__img.getBoxCenter();

    var v = this.__img.worldCoordsToImageCoords(world_coords, center);
    var p = iftGetVoxelIndex(this.__img.img, v);

    return this.__img.label.val[p];
};

ScribbleManager.prototype.newScribblesFromPoints = function(points, label, radius, scribble3D, clippingPlane,
                                                            call_finished_processing_func) {
    var i;

    if(points.length > 0) {
        this.setLabel(label);
        this.setRadius(radius);
        this.setScribble3D(scribble3D);
        this.setMarkerID(this.mk_id + 1);

        this.__new_scribble = null;
        this.__prevMouseInfo = null;

        this.newScribble(clippingPlane);

        if (points.length === 1) {
            this.appendPointsToNewScribble(points[0], points[1]);
        } else {
            for (i = 1; i < points.length; i++) {
                this.appendPointsToNewScribble(points[i-1], points[i]);
            }
        }

        var color = this.__colormap.getColor(this.__new_scribble.label);
        this.__new_scribble.addMeshesToScene(coseGUI.getScene(), color);

        // Adding new scribble and delineating of necessary
        this.addNewScribbleToCollection(call_finished_processing_func, this.__img.label, true);

        // Updating the current label to the maximum that was added
        var max_lb = IFT_NIL;

        for (i = 0; i < this.scribble_collection.length; i++) {
            max_lb = Math.max(max_lb, this.scribble_collection[i].label);
        }

        this.setLabel(max_lb);
    }
};

/*
 * Methods for dealing with scribble meshes
 */

ScribbleManager.prototype.addSribbleMeshesToScene = function (scene) {
    if(!this.__active)
        return;

    for(var i = 0; i < this.scribble_collection.length; i++) {
        var lb      = this.scribble_collection[i].label;
        var color   = this.__colormap.getColor(lb);
        this.scribble_collection[i].addMeshesToScene(scene, color);
        console.log(scribble_collection[i]);
    }
};

ScribbleManager.prototype.updateScribbleMeshes = function (visible, clippingPlane, colormap, normal_angle_visib_tolerance,
                                                           planeDist_visib_tolerance) {
    var i, lb, color;
    var cameraDir = coseGUI.camera.getWorldDirection().clone().normalize();
    var viewPlane = (new THREE.Plane(cameraDir, 0.0)).negate();
    var white = new THREE.Color(1,1,1);

    for(i = 0; i < this.scribble_collection.length; i++) {
        lb = this.scribble_collection[i].label;
        // var color = colormap.getColor(lb);
        color = new THREE.Color(colormap.getColor(lb));

        this.scribble_collection[i].updateMeshes(visible, clippingPlane, viewPlane,
                                                color, normal_angle_visib_tolerance,
                                                planeDist_visib_tolerance);
    }

    for(i = 0; i < this.__scribbles_to_remove.length; i++) {
        lb = this.__scribbles_to_remove[i].label;
        color = white.clone().sub(new THREE.Color(colormap.getColor(lb)));

        this.__scribbles_to_remove[i].updateMeshes(visible, clippingPlane, viewPlane,
                                                    color, normal_angle_visib_tolerance,
                                                    planeDist_visib_tolerance);
    }
};

ScribbleManager.prototype.updateScribbleVisibility = function (label, force_visible) {
    var i;

    for(i = 0; i < this.scribble_collection.length; i++) {
        if(this.scribble_collection[i].label === label || label < 0) {
            this.scribble_collection[i].forceVisibility = force_visible;
        }
    }

    for(i = 0; i < this.__scribbles_to_remove.length; i++) {
        if(this.__scribbles_to_remove[i].label === label || label < 0) {
            this.__scribbles_to_remove[i].forceVisibility = force_visible;
        }
    }
};


/*
 * Methods for converting scribbles into voxels
 */

ScribbleManager.prototype.scribblesToSeeds = function(checkpoint, max_checkpoint) {
    return this.__scribblesToSeedsAux(checkpoint, max_checkpoint, this.scribble_collection);
};

ScribbleManager.prototype.__scribblesToSeedsAux = function(checkpoint, max_checkpoint, scribble_collection) {
    var i, j;
    var seeds = [];

    checkpoint = checkpoint === undefined || checkpoint === null? -1 : checkpoint;

    var overlapping_labels = [];

    iftSetImage(this.__selectedVoxels, IFT_NIL);

    for(i = 0; i < scribble_collection.length; i++) {
        if(scribble_collection[i].mk_id > checkpoint && scribble_collection[i].mk_id <= max_checkpoint) {
            var res = scribble_collection[i].scribblePointsToVoxels(this.__img, this.__selectedVoxels,
                                                                        this.__adj_tolerance_dist);
            var S = res.voxels;
            overlapping_labels = overlapping_labels.concat(res.overlapping_labels);

            for (j = 0; j < S.length; j++) {
                seeds.push({elem: S[j].elem, label: S[j].label, marker: S[j].marker});
            }
        }
    }

    // Sorting the labels to select only unique labels to determine overlap
    overlapping_labels.sort();

    var filtered = [];

    var last = IFT_NIL;
    for(i = 0; i < overlapping_labels.length; i++) {
        if(overlapping_labels[i] !== last) {
            filtered.push(overlapping_labels[i]);
            last = overlapping_labels[i];
        }
    }

    return {seeds: seeds, overlapping_labels: filtered};
};

ScribbleManager.prototype.resolveScribbleOverlap = function(overlapping_labels, selected_label) {
    if(overlapping_labels.length > 0) {
        for(var i = 0; i < this.scribble_collection.length; i++) {
            if(overlapping_labels.indexOf(this.scribble_collection[i].label) >= 0) {
                this.scribble_collection[i].setLabel(selected_label);
                // Updating the marker ID to match the ID assigned to the new scribble. This
                // ensures that they be selected for a posterior scribbleToSeeds call using a newer
                // checkpoint than when the scribles were originally added.
                // The goal is to ensure that those scribbles be provided
                // once again for delineation, without having to use all
                // scribbles from scratch. Also, when the marker ID is removed
                // we avoid creating inconsistencies when labels were merged.
                this.scribble_collection[i].setMarkerID(this.__new_scribble.mk_id);
            }
        }
    }
};


ScribbleManager.prototype.closestScribblePositionToPoint = function(point_world, label) {
    var closest = null;
    var min_d = IFT_INFINITY_DBL;
    var closest_idx = -1;

    for(var i = 0; i < this.scribble_collection.length; i++) {
        if(label < 0 || this.scribble_collection[i].label === label) {
            var cand = this.scribble_collection[i].closestScribblePositionToPoint(point_world);

            if(cand !== null) {
                var d = point_world.distanceTo(cand);

                if (d < min_d) {
                    closest = cand;
                    min_d = d;
                    closest_idx = i;
                }
            }
        }
    }

    return {point:closest, distance: min_d, index: closest_idx};
};

ScribbleManager.prototype.scribblePosition = function(label) {
    for(var i = 0; i < this.scribble_collection.length; i++) {
        if (this.scribble_collection[i].label === label) {
            return this.scribble_collection[i].points[0].world_coords;
        }
    }

    return null;
};


ScribbleManager.prototype.stopModes = function () {
    this.stopAddMode();
    this.stopDelMode();
    this.stopExtendMode();
    this.stopMergeMode();
    this.stopSplitMode();

    // Erasing data from previous mode
    this.__label_to_modify = -1;
    this.__num_scribbles_added_for_splitting = 0;
};

ScribbleManager.prototype.stopAddMode = function() {
};

ScribbleManager.prototype.stopMergeMode = function() {
};

ScribbleManager.prototype.stopExtendMode = function() {
};

/*
 * Methods for deleting scribbles
 */
ScribbleManager.prototype.newClickDel = function (event) {
    if(!this.__active)
        return;

    this.__prevMouseInfo = null;
    this.__new_scribble = null;

    if (event.button === MOUSE_MAIN_BUTTON) {
        var res             = this.mouseIntersectionWithScribbleCollection(mousePositionToRelativePosition(event, renderer.domElement));
        var scribble_idx    = res.index;
        var mk_id           = res.mk_id;

        if(scribble_idx >= 0) {
            this.selectScribblesForRemoval([mk_id], SCRIBBLE_SELECTION_BY_MARKER_ID, true);
        }
    }
};


ScribbleManager.prototype.stopDelMode = function() {
};

/* Methods for selecting markers for removal */

ScribbleManager.prototype.selectScribblesForRemoval = function (ids, type, save_state) {
    var remaining_scribbles = [];

    if(save_state) {
        // Saving the state
        this.state_machine.addState(SCRIBBLE_MANAGER_MODE_DEL, ids, -1, type);
    }

    for(var i = 0; i < this.scribble_collection.length; i++) {
        switch(type) {
            default:
            case SCRIBBLE_SELECTION_BY_MARKER_ID:
                if (ids.indexOf(this.scribble_collection[i].mk_id) >= 0) {
                    this.__scribbles_to_remove.push(this.scribble_collection[i]);
                } else {
                    remaining_scribbles.push(this.scribble_collection[i]);
                }
                break;
            case SCRIBBLE_SELECTION_BY_LABEL:
                if (ids.indexOf(this.scribble_collection[i].label) >= 0) {
                    this.__scribbles_to_remove.push(this.scribble_collection[i]);
                } else {
                    remaining_scribbles.push(this.scribble_collection[i]);
                }
                break;
            case SCRIBBLE_SELECTION_BY_TIMESTAMP:
                if (ids.indexOf(this.scribble_collection[i].creation_timestamp) >= 0) {
                    this.__scribbles_to_remove.push(this.scribble_collection[i]);
                } else {
                    remaining_scribbles.push(this.scribble_collection[i]);
                }
                break;
        }
    }

    this.scribble_collection = remaining_scribbles;
};


/* Methods for deselecting markers selected for removal */

ScribbleManager.prototype.deselectScribblesForRemoval = function(ids, type) {
    var remaining_scribbles = [];

    for(var i = 0; i < this.__scribbles_to_remove.length; i++) {
        switch(type) {
            default:
            case SCRIBBLE_SELECTION_BY_MARKER_ID:
                if (ids.indexOf(this.__scribbles_to_remove[i].mk_id) >= 0) {
                    this.scribble_collection.push(this.__scribbles_to_remove[i]);
                } else {
                    remaining_scribbles.push(this.__scribbles_to_remove[i]);
                }
                break;
            case SCRIBBLE_SELECTION_BY_LABEL:
                if (ids.indexOf(this.__scribbles_to_remove[i].label) >= 0) {
                    this.scribble_collection.push(this.__scribbles_to_remove[i]);
                } else {
                    remaining_scribbles.push(this.__scribbles_to_remove[i]);
                }
                break;
            case SCRIBBLE_SELECTION_BY_TIMESTAMP:
                if (ids.indexOf(this.__scribbles_to_remove[i].creation_timestamp) >= 0) {
                    this.scribble_collection.push(this.__scribbles_to_remove[i]);
                } else {
                    remaining_scribbles.push(this.__scribbles_to_remove[i]);
                }
                break;
        }
    }

    this.__scribbles_to_remove = remaining_scribbles;
};



ScribbleManager.prototype.scribblesSelectedForRemovalToSeeds = function() {
    return this.__scribblesToSeedsAux(-1, IFT_INFINITY_INT, this.__scribbles_to_remove);
};

ScribbleManager.prototype.finishDeletingScribble = function() {
    // Issuing removal command if there are scribbles to remove
    if (this.__scribbles_to_remove.length > 0) {
        this.callFinishProcessingFunc();
    }
};


/*
 * Methods for splitting labels
 */
ScribbleManager.prototype.newClickSplit = function (event) {
    if(!this.__active)
        return;

    this.__prevMouseInfo = null;
    this.__new_scribble = null;

    if (event.button === MOUSE_MAIN_BUTTON) {
        var mouseInfo       = intersectMousePositionAndClippingPlane(mousePositionToRelativePosition(event, renderer.domElement),
                                                                        coseGUI.camera, coseGUI.clippingPlane);

        if (mouseInfo !== null && iftVoxelInBoundingBox(this.__img.bb_world, mouseInfo.world_coords)) {
            var label = this.selectLabelUnderMousePosition(mouseInfo.world_coords);

            /** Undoing previous selection since the user decided to split a different cell than the one s/he started **/
            // Deselecting previously selected label for splitting since the user has clicked on a different one
            // (this is indicated by this.__label_to_modify being non-negative and different than the current label)
            if(this.__label_to_modify >= 0 && this.__label_to_modify !== label) {
                // The scribbles that were set for removal must be cleared here, since they were not used by the
                // delineation algorithm. We do this by calling this.undoFirstSplitStep with clear_scribbles = true
                this.undoFirstSplitStep(true);
            }

            /** Selecting a label to split or continuing to split a label if the user selected two scribbles
             * over the same label. The markers on the old label are marked for removal and the new ones are used
             * for splitting. The visibility of the old markers is temporarily set to ALWAYS in order to show the
             * user that the label will be split.
             **/
            if (this.__label_to_modify < 0) {
                this.__label_to_modify = label;
                this.__num_scribbles_added_for_splitting = 1;

                // Marking the scribble for removal
                this.selectScribblesForRemoval([this.__label_to_modify], SCRIBBLE_SELECTION_BY_LABEL, true);
                // Forcing the scribble of the label being split to never be displayed even if the clipping plane does not cuts it
                this.updateScribbleVisibility(this.__label_to_modify, VISIBILITY_NEVER);
            } else {
                this.__num_scribbles_added_for_splitting++;
            }

            // Calling newClickAdd to trigger a normal scribble addition event
            this.newClickAdd(event);
        }
    }
};

ScribbleManager.prototype.stopSplitMode = function() {
    if(this.__mode === SCRIBBLE_MANAGER_MODE_SPLIT) {
        if (this.__label_to_modify >= 0) {
            this.undoFirstSplitStep(true);
            this.clearScribblesSelectedForRemoval(coseGUI.getScene());

            coseGUI.selectLabelsForDisplay([DISPLAY_ALL_LABEL_MESHES], true);
        }
        this.__label_to_modify = -1;
        this.__new_scribble = 0;
    }
};

ScribbleManager.prototype.finishDrawingScribbleSplit = function(event) {
    if(!this.__active)
        return;

    if(event.button === MOUSE_MAIN_BUTTON) {
        var curMouseInfo = intersectMousePositionAndClippingPlane(mousePositionToRelativePosition(event, renderer.domElement),
            coseGUI.camera, coseGUI.clippingPlane);

        if (this.__prevMouseInfo !== null) {
            var is_second_scribble = this.__num_scribbles_added_for_splitting > 1;

            if (curMouseInfo !== null && iftVoxelInBoundingBox(this.__img.bb_world, curMouseInfo.world_coords)) {
                this.appendPointsToNewScribble(this.__prevMouseInfo, curMouseInfo);
            }

            var new_label = this.addNewScribbleToCollection(is_second_scribble, this.__img.label, true);

            if(is_second_scribble) {
                guiParams.overlay = LABEL_MESH_OVERLAY;

                var new_labels = [guiParams.selLabels[guiParams.selLabels.length - 1], new_label];
                coseGUI.selectLabelsForDisplay(new_labels, false);

                this.__num_scribbles_added_for_splitting = 0;
                this.__label_to_modify = -1;
            } else {
                guiParams.overlay = LABEL_MESH_OVERLAY;

                coseGUI.selectLabelsForDisplay([this.__label_to_modify, new_label], false);
            }
        }

        this.__prevMouseInfo = null;
        this.__new_scribble = null;
    }
};



ScribbleManager.prototype.mouseIntersectionWithScribbleCollection = function(mousePos) {
    if(!this.__active)
        return;

    var mouseInfo       = null;
    var min_dist        = IFT_INFINITY_DBL;
    var sel_adj_label   = -1;
    var mk_id           = -1;
    var idx             = -1;

    for(var i = 0; i < this.scribble_collection.length; i++) {
        var res = intersectMousePositionMeshes(mousePos, coseGUI.camera, this.scribble_collection[i].meshes);

        if(res.mouseInfo !== null && res.distance < min_dist) {
            mouseInfo       = res.mouseInfo.clone();
            min_dist        = res.distance;
            sel_adj_label   = this.scribble_collection[i].label;
            mk_id           = this.scribble_collection[i].mk_id;
            idx = i;
        }
    }

    return {label:sel_adj_label, mk_id: mk_id, index: idx, distance: min_dist};
};

ScribbleManager.prototype.focusOnLabel = function(event) {
    if(!this.__active)
        return;

    if(event.button === MOUSE_MAIN_BUTTON) {
        var mouseInfo = intersectMousePositionAndClippingPlane(mousePositionToRelativePosition(event, renderer.domElement),
            coseGUI.camera, coseGUI.clippingPlane);

        if (mouseInfo !== null && iftVoxelInBoundingBox(this.__img.bb_world, mouseInfo.world_coords)) {
            var lb = this.selectLabelUnderMousePosition(mouseInfo.world_coords);
            if(lb > 0) {
                if(guiParams.overlay !== LABEL_MESH_OVERLAY || this.__prev_overlay === undefined)
                    this.__prev_overlay = guiParams.overlay;

                guiParams.overlay = LABEL_MESH_OVERLAY;
                coseGUI.selectLabelsForDisplay([lb], true);
            }
        } else {
            if(this.__prev_overlay !== undefined) {
                guiParams.overlay = this.__prev_overlay;
                this.__prev_overlay = undefined;
            }

            if(guiParams.selLabels[0] === DISPLAY_ALL_LABEL_MESHES)
                coseGUI.selectLabelsForDisplay([DISPLAY_NO_LABEL_MESH], true);
            else {
                coseGUI.selectLabelsForDisplay([DISPLAY_ALL_LABEL_MESHES], true);
            }
        }
    }
};


ScribbleManager.prototype.undo = function (do_delineation) {
    this.state_machine.undo(do_delineation);
};

ScribbleManager.prototype.redo = function (do_delineation) {
    this.state_machine.redo(do_delineation);
};


ScribbleManager.prototype.undoAdd = function (old_state, call_finished_processing_func) {
    var i, key;
    var marker_id_map = {};
    var timestamp_marker_id_map = {};
    var timestamp_label_map = {};
    var new_mk_id = this.mk_id + 1;

    console.log('Undoing add', old_state);

    // Hashmap used to attribute new marker ids for the old scribbles that were modified and need to be reinserted
    for(i = 0; i < old_state.modified_scribbles.length; i++) {
        key = old_state.modified_scribbles[i].mk_id;
        if (marker_id_map[key] === undefined) {
            marker_id_map[key] = new_mk_id++;
            // Increasing the marker ID to match the last one that was added.
            this.setMarkerID(marker_id_map[key]);
        }
    }

    for(i = 0; i < old_state.modified_scribbles.length; i++) {
        key = old_state.modified_scribbles[i].mk_id;

        // Setting the new marker IDs for the old scribbles to ensure that they will be used once again for delineation
        timestamp_marker_id_map[old_state.modified_scribbles[i].creation_timestamp] = marker_id_map[key];
        // Setting a label map to revert the labels of the modified scribbles
        timestamp_label_map[old_state.modified_scribbles[i].creation_timestamp] = old_state.modified_scribbles[i].label;
    }

    if(old_state.added_scribble !== null) {
        // Marking the added scribble for removal by using its creation timestamp for selection
        this.selectScribblesForRemoval([old_state.added_scribble.creation_timestamp], SCRIBBLE_SELECTION_BY_TIMESTAMP, false);

        // Updating the marker IDs and labels of old markers that were originally affected by the addition of the marker
        // being removed
        for(i = 0; i < this.scribble_collection.length; i++) {
            key = this.scribble_collection[i].creation_timestamp;
            if(timestamp_marker_id_map[key] !== undefined) {
                this.scribble_collection[i].mk_id = timestamp_marker_id_map[key];
                this.scribble_collection[i].label = timestamp_label_map[key];
            }
        }
    } else {
        throw 'Added scribble missing from old_state:' + old_state;
    }

    if (call_finished_processing_func)
        this.callFinishProcessingFunc();
};

ScribbleManager.prototype.redoAdd = function (old_state, call_finished_processing_func) {
    var new_mk_id = this.mk_id + 1;

    console.log('Redoing add', old_state);

    if(old_state.added_scribble !== null) {
        this.__new_scribble = old_state.added_scribble.clone(false);

        // The label of the old scribble s
        var lb = this.__new_scribble.label;
        var color = this.__colormap.getColor(lb);

        // Updating the marker ID of the old scribble to ensure that it will be used by the delineation algorithm
        this.setMarkerID(new_mk_id);
        // Setting the label to the current label lb to update this.__max_label
        this.setLabel(lb);
        // Again, setting the label to old_state.selected_label to make sure that this.__max_label will have the appropriate value
        this.setLabel(old_state.selected_label);
        this.__new_scribble.setMarkerID(new_mk_id);
        // Recreating the meshes for the old scribble
        this.__new_scribble.createMeshes(coseGUI.getScene());
        this.__new_scribble.addMeshesToScene(coseGUI.getScene(), color);

        // Saving current mode
        var cur_mode = this.__mode;
        // Temporarily using the mode that was used to add the scribble
        this.setMode(old_state.mode);

        // Redoing the addition operation using the appropriate mode. Contrary to undoDel, we add the scribble
        // using addNewScribbleToCollection to make sure that the scribbles overlapped by the new one have their
        // labels and marker IDs properly updated. Technically, not using addNewScribbleToCollection should not
        // be problem.
        var new_label = this.addNewScribbleToCollection(false, this.__img.label, false);

        // If a given label was selected for rendition, we update it to display the newly added label
        if(guiParams.overlay === LABEL_MESH_OVERLAY && guiParams.selLabels[0] > 0) {
            coseGUI.selectLabelsForDisplay([new_label], false);
        }

        // Restoring current mode
        this.setMode(cur_mode);

        if (call_finished_processing_func)
            this.callFinishProcessingFunc();

    } else {
        throw 'Added scribble missing from old_state';
    }

    this.__new_scribble = null;
    this.__prevMouseInfo = null;

};

ScribbleManager.prototype.undoDel = function(old_state, call_finished_processing_func) {
    var i;
    var marker_id_map = {};
    var new_mk_id = this.mk_id + 1;

    console.log('Undoing del', old_state);

    // Hashmap used to attribute new marker IDs for the old scribbles that were deleted and must be added once again.
    // If more than one scribble has the same marker ID, we update the marker ID in the common hashmap to make sure
    // that all scribbles be given the same updated marker ID.
    for(i = 0; i < old_state.modified_scribbles.length; i++) {
        var key = old_state.modified_scribbles[i].mk_id;
        if(marker_id_map[key] === undefined) {
            marker_id_map[key] = new_mk_id++;
            // Increasing the marker ID to match the last one that was added.
            this.setMarkerID(marker_id_map[key]);
        }
    }

    // Going through all scribbles that were modified by the deletion operation, and adding them back to the scribble
    // collection before updating the delineation.
    for(i = 0; i < old_state.modified_scribbles.length; i++) {
        // Copying the old scribble to this.__new_scribble for addition
        this.__new_scribble = old_state.modified_scribbles[i].clone(false);

        // The label of the old scribble s
        var lb = this.__new_scribble.label;
        var color = this.__colormap.getColor(lb);

        // Updating the marker ID of the old scribble to ensure that it will be used by the delineation algorithm
        this.__new_scribble.setMarkerID(marker_id_map[this.__new_scribble.mk_id]);
        // Recreating the meshes for the old scribble
        this.__new_scribble.createMeshes(coseGUI.getScene());
        this.__new_scribble.addMeshesToScene(coseGUI.getScene(), color);

        // Setting the current label to match the label of the scribble. We do this to ensure that this.__max_label
        // be properly set
        this.setLabel(this.__new_scribble.label);

        // Adding the old scribble to the collection. This is safe to do instead of calling addNewScribbleToCollection
        // because we alredy know the final label and marker ID that the scribble should have. Hence, there is no
        // practical reason for calling that more expensive function. TODO: just a reminder, in case
        // addNewScribbleToCollection is modified, this function undoDel must be revised as well.
        this.scribble_collection.push(this.__new_scribble);

        this.__new_scribble     = null;
        this.__prevMouseInfo    = null;
    }

    if (call_finished_processing_func)
        this.callFinishProcessingFunc();
};

ScribbleManager.prototype.redoDel = function(old_state, call_finished_processing_func) {
    console.log('Redoing del', old_state);

    if(old_state.operation === SCRIBBLE_MANAGER_MODE_DEL) {

        var modified_ids = [];

        for(var i = 0; i < old_state.modified_scribbles.length; i++) {
            modified_ids.push(old_state.modified_scribbles[i].creation_timestamp);
        }

        // Selecting the scribbles for removal by timestamp, since their marker IDs may have changed
        this.selectScribblesForRemoval(modified_ids, SCRIBBLE_SELECTION_BY_TIMESTAMP, false);
    } else {
        this.state_machine.printStates();
        throw 'Invalid operation type when redoing delete operation. Type:' + old_state.operation;
    }

    if (call_finished_processing_func) {
        this.callFinishProcessingFunc();
    }
};


ScribbleManager.prototype.undoFirstSplitStep = function (clear_scribbles) {
    // Requesting the state machine to undo the first splitting step operations (Add and Del)
    this.state_machine.undoFirstSplitStep();

    // Removing all scribbles marked for removal if requested. This is important to do when the delineation algorithm
    // was not called.
    if(clear_scribbles)
        this.clearScribblesSelectedForRemoval(coseGUI.getScene());

    // Resetting the splitting data
    this.__num_scribbles_added_for_splitting = 0;
    this.__label_to_modify = -1;
};

function ScribbleManagerState(scribble_manager, operation, modified_ids, selected_label_overlap, scribble_selection_type) {
    this.mode               = scribble_manager.__mode;
    this.operation          = operation;
    this.added_scribble     = (scribble_manager.__new_scribble !== null) ? scribble_manager.__new_scribble.clone(false) : null;
    this.modified_scribbles = [];
    this.selected_label     = selected_label_overlap;

    if(modified_ids !== null) {
        for (var i = 0; i < scribble_manager.scribble_collection.length; i++) {
            switch(scribble_selection_type) {
                default:
                case SCRIBBLE_SELECTION_BY_LABEL:
                    if (modified_ids.indexOf(scribble_manager.scribble_collection[i].label) >= 0) {
                        this.modified_scribbles.push(scribble_manager.scribble_collection[i].clone(false));
                    }
                    break;
                case SCRIBBLE_SELECTION_BY_MARKER_ID:
                    if (modified_ids.indexOf(scribble_manager.scribble_collection[i].mk_id) >= 0) {
                        this.modified_scribbles.push(scribble_manager.scribble_collection[i].clone(false));
                    }
                    break;
                case SCRIBBLE_SELECTION_BY_TIMESTAMP:
                    if (modified_ids.indexOf(scribble_manager.scribble_collection[i].creation_timestamp) >= 0) {
                        this.modified_scribbles.push(scribble_manager.scribble_collection[i].clone(false));
                    }
                    break;
            }
        }
    }
}

function ScribbleManagerStateMachine(scribble_manager) {
    this.scribble_manager = scribble_manager;
    this.states = [];
    this.cur_state = -1;
}

ScribbleManagerStateMachine.prototype.addState = function (operation, modified_ids, selected_label_overlap, scribble_selection_type) {
    var new_state = new ScribbleManagerState(this.scribble_manager, operation, modified_ids, selected_label_overlap, scribble_selection_type);

    if(this.cur_state >= 0) {
        this.states = this.states.slice(0, this.cur_state + 1);
    }

    this.states.push(new_state);
    this.cur_state = this.states.length - 1;
};

ScribbleManagerStateMachine.prototype.printStates = function() {
    for(var i = 0; i < this.states.length; i++) {
        console.log('State:', i,  this.states[i]);
    }
    console.log('Current state:', this.cur_state);
};

ScribbleManagerStateMachine.prototype.undo = function (do_delineation) {

    if(this.cur_state >= 0) {
        var old_state = this.states[this.cur_state];

        switch (old_state.mode) {
            case SCRIBBLE_MANAGER_MODE_ADD:
            case SCRIBBLE_MANAGER_MODE_MERGE:
            case SCRIBBLE_MANAGER_MODE_EXTEND:
                this.scribble_manager.undoAdd(old_state, do_delineation);
                this.cur_state--;
                break;
            case SCRIBBLE_MANAGER_MODE_DEL:
                this.scribble_manager.undoDel(old_state, do_delineation);
                this.cur_state--;
                break;
            case SCRIBBLE_MANAGER_MODE_SPLIT:
                var second_split_step_undone = false;

                if(this.cur_state - 1 > 0 && old_state.operation === SCRIBBLE_MANAGER_MODE_ADD
                    && this.states[this.cur_state - 1].mode === SCRIBBLE_MANAGER_MODE_SPLIT && this.states[this.cur_state - 1].operation === SCRIBBLE_MANAGER_MODE_ADD
                    && this.states[this.cur_state - 2].mode === SCRIBBLE_MANAGER_MODE_SPLIT && this.states[this.cur_state - 2].operation === SCRIBBLE_MANAGER_MODE_DEL) {

                    console.log('Undoing second split step');
                    // Undoing second split step
                    old_state = this.states[this.cur_state];
                    this.scribble_manager.undoAdd(old_state, false);
                    this.cur_state--;

                    old_state = this.states[this.cur_state];

                    second_split_step_undone = true;
                }

                // Undoing first split step
                if(this.cur_state > 0 && old_state.operation === SCRIBBLE_MANAGER_MODE_ADD
                    && this.states[this.cur_state - 1].mode === SCRIBBLE_MANAGER_MODE_SPLIT && this.states[this.cur_state -1].operation === SCRIBBLE_MANAGER_MODE_DEL) {
                    this.scribble_manager.undoFirstSplitStep(false);

                    // IMPORTANT: If the second splitting step was not done, then we eliminate the first splitting step from the
                    // state machine (i.e., we remove the deletion and addition operations) since the splitting operation
                    // was not entirely concluded. If we did not do that, then we would have to restore the state of the
                    // scribble manager to the splitting mode. This could be counterintuitive if the user was undoing
                    // several operations without changing the current mode. Hence, for simplicity the splitting operation
                    // can only be redone if both steps were carried out.
                    if(!second_split_step_undone) {
                        if(this.cur_state >= 0) {
                            this.states = this.states.slice(0, this.cur_state + 1);
                        }
                        this.cur_state = this.states.length - 1;
                    }
                }

                if(do_delineation)
                    this.scribble_manager.callFinishProcessingFunc();
                break;
            default:
                throw 'Error. Invalid scribble manager operation!';
                break;
        }

    }
};

ScribbleManagerStateMachine.prototype.redo = function (do_delineation) {

    if(this.cur_state >= 0 && this.cur_state < this.states.length - 1) {
        var old_state;

        this.cur_state++;
        old_state = this.states[this.cur_state];

        switch (old_state.mode) {
            case SCRIBBLE_MANAGER_MODE_ADD:
            case SCRIBBLE_MANAGER_MODE_MERGE:
            case SCRIBBLE_MANAGER_MODE_EXTEND:
                this.scribble_manager.redoAdd(old_state, do_delineation);
                break;
            case SCRIBBLE_MANAGER_MODE_DEL:
                this.scribble_manager.redoDel(old_state, do_delineation);
                break;
            case SCRIBBLE_MANAGER_MODE_SPLIT:
                // Redoing first split step
                this.redoFirstSplitStep(old_state);
                // Verifying if the second split step was done and redoing it in case it was
                if(this.cur_state < this.states.length - 1 && this.states[this.cur_state + 1].mode === SCRIBBLE_MANAGER_MODE_SPLIT) {
                    this.cur_state++;
                    old_state = this.states[this.cur_state];

                    // Ensuring that the splitting operation was successfully carried out, in which case the third operation
                    // was a marker addition
                    if(old_state.operation === SCRIBBLE_MANAGER_MODE_ADD) {
                        this.scribble_manager.redoAdd(old_state, do_delineation);
                    } else {
                        throw 'Error when undoing the second step of the splitting operation. The third operation was not an addition.';
                    }
                }
                break;
            default:
                throw 'Error. Invalid scribble manager operation!';
                break;
        }

    }
};


ScribbleManagerStateMachine.prototype.undoFirstSplitStep = function() {
    if(this.cur_state >= 0) {
        var old_state = this.states[this.cur_state];
        if (old_state.mode === SCRIBBLE_MANAGER_MODE_SPLIT) {

            console.log('Undoing first split step');

            if(old_state.operation === SCRIBBLE_MANAGER_MODE_ADD) {
                console.log('Undoing first split step add');

                this.scribble_manager.undoAdd(old_state, false);
                this.cur_state--;
            } else {
                throw 'Error when undoing the first step of the splitting operation. The second operation was not an addition.';
            }

            if(this.cur_state >= 0 && this.states[this.cur_state].mode == SCRIBBLE_MANAGER_MODE_SPLIT && this.states[this.cur_state].operation === SCRIBBLE_MANAGER_MODE_DEL) {
                console.log('Undoing first split step del');

                old_state = this.states[this.cur_state];
                this.scribble_manager.undoDel(old_state, false);
                this.cur_state--;
            } else {
                throw 'Error when undoing the first step of the splitting operation. The first operation was not a deletion.';
            }
        }
    }
};

ScribbleManagerStateMachine.prototype.redoFirstSplitStep = function(old_state) {
    if(this.cur_state >= 0 && this.cur_state < this.states.length - 1) {
        console.log('redoing, cur_state', this.cur_state, old_state);

        if (old_state.mode === SCRIBBLE_MANAGER_MODE_SPLIT) {
            if(old_state.operation === SCRIBBLE_MANAGER_MODE_DEL && this.states[this.cur_state + 1].mode === SCRIBBLE_MANAGER_MODE_SPLIT
                    && this.states[this.cur_state + 1].operation === SCRIBBLE_MANAGER_MODE_ADD) {
                this.scribble_manager.redoDel(old_state, false);
                this.cur_state++;

                old_state = this.states[this.cur_state];
                this.scribble_manager.redoAdd(old_state, false);
            } else {
                throw 'Error when redoing the first step of the splitting operation. The sequence of states does not correspond to the first step of splitting operation:' +
                    old_state + ' ' + this.states[this.cur_state + 1];
            }
        } else {
            throw 'Error when redoing the first step of the splitting operation. The old_state mode is not the correct one:' + old_state.mode;
        }
    }
};
