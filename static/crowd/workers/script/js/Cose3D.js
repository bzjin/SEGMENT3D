"use strict";

/******************************************************************************************************************/
/*												GUI initialization										  	 	  */
/******************************************************************************************************************/

// IMPORTANT: THREE.js hack!!! to display solid colors when clipping meshes (this gives the appearance that
// the mesh representing the border of segmentation is being sliced when using a custom shader)
function changeDefaultMeshLambertMaterialShaders(meshlambert_frag) {

    THREE.ShaderChunk.meshlambert_frag 	 	= meshlambert_frag;
    THREE.ShaderLib.lambert.fragmentShader 	= THREE.ShaderChunk.meshlambert_frag;
}

function initWebGL() {
    optimize_for_mobile = isMobileBrowser();

    if (!Detector.webgl){
        Detector.addGetWebGLMessage;
    }

    changeDefaultMeshLambertMaterialShaders(custom_meshlambert_frag)

    loadFont();
}

function GUIParams(firstSelectedImage) {
    this.curModel 					= firstSelectedImage;
    this.steps 						= 256.0;
    this.alphaCorrection 			= 1.0;
    this.alphaLabelCorrection 		= 5.0;
    this.gammaCorrection            = 1.0;

    this.intensity_as_alpha         = false;
    this.borderThresh 				= 0.5;
    this.borderColor 				= colorMapBin.getColor(1);


    this.planeDist 					= 0.0;
    this.fixateClippingPlane 		= true;

    this.setGrayscaleTransfColors();

    this.useLogTransfFunction 		= false;
    this.k_logFun 					= 7.0;
    this.x0_logFun 					= 0.5;

    this.clippingPlaneDir 			= CLIPPING_PLANE_DIR_NEG;
    this.labelWireframe 			= false;
    this.overlayAlpha 				= 0.5;
    this.labelEroRadius 			= 0.0;
    this.show3DRendition 			= true;
    this.showAdjacentLabels 		= false;
    this.neighborsSameColor 		= false;

    this.operations					= SCRIBBLE_MANAGER_MODE_ADD;
    this.scribbleRadius				= 1.5;

    this.showScribbles 				= true;
    this.scribbles3D 				= true;
    this.viewPlane 					= XY_PLANE;

    // Default visualization is the 3D border mesh
    this.overlay 					= BORDER_MESH_OVERLAY;
    this.setSelectedLabels([BORDER_LABEL_ID]);

    // Buttons
    this.delineate 					= delineate;
    this.resetDelineation 			= resetDelineation;
    this.clearScribbles	 			= clearHandlers;
    this.undo						= undo;
    this.redo						= redo;

    this.flipPlane					= 	function flipPlane() {
        coseGUI.flipPlane();
    };
}

GUIParams.prototype.setSelectedLabels = function(lb) {
    this.selLabels = lb;
    console.log('Selecting labels', this.selLabels);
};

GUIParams.prototype.setGrayscaleTransfColors = function() {
    this.transfColor0 				= new THREE.Color("#000000");
    this.transfColor1 				= new THREE.Color("#7f7f7f");
    this.transfColor2 				= new THREE.Color("#ffffff");
};

GUIParams.prototype.setJetColormapTransfColors = function() {
    this.transfColor0 				= new THREE.Color("#0000ff");
    this.transfColor1 				= new THREE.Color("#ffff00");
    this.transfColor2 				= new THREE.Color("#ff0000");
};

GUIParams.prototype.setGreenColormapTransfColors = function() {
    this.transfColor0 				= new THREE.Color("#000000");
    this.transfColor1 				= new THREE.Color("#007f00");
    this.transfColor2 				= new THREE.Color("#00ff00");
};

function changeOverlay(value) {
    if (parseInt(value) === BORDER_MESH_OVERLAY) {
        coseGUI.selectLabelsForDisplay([BORDER_LABEL_ID], true);
    } else if (parseInt(value) === LABEL_MESH_OVERLAY) {
        coseGUI.selectLabelsForDisplay([DISPLAY_ALL_LABEL_MESHES], true);
    }
}

function createAdvancedGUIControls() {
    if(advancedGUIControls !== null)
        advancedGUIControls.destroy();

    advancedGUIControls = new dat.GUI();
    advancedGUIControls.close();

    var scribbleModeChange		= advancedGUIControls.add(guiParams, 'operations', {Add: SCRIBBLE_MANAGER_MODE_ADD,
                                                    Del: SCRIBBLE_MANAGER_MODE_DEL, Merge: SCRIBBLE_MANAGER_MODE_MERGE,
                                                    Extend: SCRIBBLE_MANAGER_MODE_EXTEND, Split: SCRIBBLE_MANAGER_MODE_SPLIT});

    advancedGUIControls.add(guiParams, 'delineate');
    advancedGUIControls.add(guiParams, 'undo');
    advancedGUIControls.add(guiParams, 'redo');

    advancedGUIControls.add(guiParams, 'resetDelineation');
    advancedGUIControls.add(guiParams, 'clearScribbles');

    scribbleModeChange.listen();
    scribbleModeChange.onChange(function(value) {
        if(scribbleManager !== null) {
            scribbleManager.stopModes();
            scribbleManager.setMode(parseInt(value));
        }
    });

    var overlayChange;
    if(!optimize_for_mobile) {
        overlayChange = advancedGUIControls.add(guiParams, 'overlay', {
            "None": NO_OVERLAY,
            "Fill": LABEL_OVERLAY,
            "Border": BORDER_OVERLAY,
            "3D Label": LABEL_MESH_OVERLAY,
            "3D Border": BORDER_MESH_OVERLAY
        });
    } else {
       overlayChange = advancedGUIControls.add(guiParams, 'overlay', {"None": NO_OVERLAY, "3D Label" : LABEL_MESH_OVERLAY,"3D Border" : BORDER_MESH_OVERLAY});
    }
    overlayChange.listen();
    overlayChange.onChange(changeOverlay);


    advancedGUIControls.planeDistControl = advancedGUIControls.add(guiParams, 'planeDist', -1.0, 1.0);
    var fixateClippingPlaneChange = advancedGUIControls.add(guiParams, 'fixateClippingPlane').listen();
    advancedGUIControls.add(guiParams, 'flipPlane');

    advancedGUIControls.planeDistControl.step(0.001);
    advancedGUIControls.planeDistControl.listen();


    fixateClippingPlaneChange.listen();
    fixateClippingPlaneChange.onChange(function(value) {
        coseGUI.setCameraFocus(true);
    });


    advancedGUIControls.add(guiParams, 'showScribbles');
    advancedGUIControls.add(guiParams, 'show3DRendition');
    advancedGUIControls.add(guiParams, 'labelEroRadius', 0.0, 3.0).step(0.5);
    advancedGUIControls.add(guiParams, 'labelWireframe');
    advancedGUIControls.add(guiParams, 'showAdjacentLabels');
//        advancedGUIControls.add(guiParams, 'neighborsSameColor');
    var viewPlaneChange = advancedGUIControls.add(guiParams, 'viewPlane', {XY: XY_PLANE, XZ: XZ_PLANE, YZ: YZ_PLANE});

    viewPlaneChange.onChange(function(value) {
        coseGUI.changeOrthogonalCameraView(parseInt(value));
    });


    var fAdvanced = advancedGUIControls.addFolder('Advanced Options');

    var scribbleRadiusChange 	= fAdvanced.add(guiParams, 'scribbleRadius', 1.0, 5.0).step(0.5);
    scribbleRadiusChange.onChange(function(value) {
        if(scribbleManager !== null) {
            scribbleManager.setRadius(value);
        }
    });

    fAdvanced.add(guiParams, 'steps', 0.0, 512.0).listen();
    fAdvanced.add(guiParams, 'gammaCorrection', 0.01, 10.0).step(0.01);
    fAdvanced.add(guiParams, 'alphaCorrection', 0.01, 5.0).step(0.01);
    fAdvanced.add(guiParams, 'intensity_as_alpha');
    fAdvanced.add(guiParams, 'useLogTransfFunction');
    fAdvanced.add(guiParams, 'k_logFun', 0.0, 20.0).step(0.1);
    fAdvanced.add(guiParams, 'x0_logFun', 0.0, 1.0).step(0.01);


//        modelSelected.onChange(loadImage);

//        clippingPlaneDirChange.onChange(function (value) {
//            coseGUI.clippingPlaneDir = parseFloat(value);
//        });


}


function initCose3D() {

    var firstSelectedImage = null;

    guiParams = new GUIParams(firstSelectedImage);

    if(show_advanced_GUI_controls)
        createAdvancedGUIControls();

    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer( {alpha:true, antialias:true} );
    else
        renderer = new THREE.CanvasRenderer();

    renderer.localClippingEnabled = true;
    renderer.setClearColor( 0x000000, 0 );

    window.addEventListener( 'resize', onWindowResize, false );
}

/******************************************************************************************************************/
/*												Image/data loading										  	 	  */
/******************************************************************************************************************/

function loadImageInfo(callback) {
    var filename = "images.json";
    var path = filename;

    readJsonFile(path, parseImageInfoFile, callback);
}

function readJsonFile(file, callback, callback_after) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        console.log('on ready loading seeds', file, rawFile.readyState, rawFile.status);
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            console.log('on ready 222 loading seeds', file, rawFile.responseText);
            callback(rawFile.responseText, callback_after);
        } else {
            console.log('on ready loadin333g seeds', file);
        }
    };
    rawFile.send(null);
}

function parseImageInfoFile(text, callback) {
    imgInfo = JSON.parse(text);
    console.log(imgInfo);
    callback();
}

function createAvailableImagesFromInfo(key) {
    currentImage = new ImageData();
}


// function parseImageInfoFile(text, params) {
//     imgInfo = JSON.parse(text);
//
//     createAvailableImagesFromInfo(imgInfo);
//
//     init();
//
//     animate();
// }


function readImageDataArray(path, callback, callback_options) {
    var oReq = new XMLHttpRequest();

    console.log('Reading image array buffer');
    console.log(path);

    oReq.open("GET", path, true);
    oReq.responseType = "arraybuffer";

    oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
            callback(arrayBuffer, callback_options);
        }
    };
    oReq.send(null);
}

// function nextImage() {
//     var r;
//     if(guiParams.curImgIdx + 1 < imgInfo.images.length) {
//         // if(guiParams.curImgIdx >= 0) {
//         //     r = window.confirm('Finish segmentation and submit result?');
//         //     if(r === false)
//         //         return;
//         // }
//         guiParams.curImgIdx++;
//         loadImage(imgInfo.images[guiParams.curImgIdx].key);
//     } else {
//         if(guiParams.curImgIdx >= 0 && coseGUI !== null) {
//             r = window.confirm('Finish segmentation and submit result?');
//             if(r === true) {
//                 window.alert('Thank you for your collaboration!');
//                 guiParams.curImgIdx++;
//                 clearScene();
//             }
//         }
//     }
// }

function loadImage(imgInfo) {
    var filename = null;

    if(imgInfo !== undefined && imgInfo !== null) {
        // Verifying if the image texture has been loaded. If it wasn't loaded, then the image data array is
        // read first and then the image texture is loaded
        if (currentImage.img === null) {
            console.log('Requesting to read image array buffer');

            filename = imgInfo.filename;

            if (filename !== null) {
                var parameters = {'imgInfo': imgInfo};

                readImageDataArray(filename, loadImageFile, parameters);
            }
        } else {
            console.log('Selecting previously loaded image');

            imageSelection(imgInfo.key);
        }
    } else {
        guiParams.curModel = null;

        // Clearing entire scene
        clearScene();
    }
}


function loadImageFile(arrayBuffer, parameters) {
    var imgInfo = parameters['imgInfo'];
    var key = imgInfo.key;
    var xsize, ysize, zsize, context_border;

    xsize 	= imgInfo.xsize;
    ysize 	= imgInfo.ysize;
    zsize 	= imgInfo.zsize;
    context_border = imgInfo.context_border;

    console.log('Loading image texture');
    console.log(key);

    currentImage.createImageFromBuffer(arrayBuffer, xsize, ysize, zsize);
    currentImage.setTileContextBorder(context_border);

    // Setting a small value for the number os steps required to render the volume, to speed up ray casting.
    // This value is larger than or equal to the diagonal of the texture box
    // TODO: move this to a more elegant place
    if(guiParams !== null) {
        guiParams.steps = Math.max(currentImage.texture.xsize,currentImage.texture.ysize,
                                currentImage.texture.zsize) * Math.round(Math.sqrt(3.0));
    }

    if(advancedGUIControls !== null) {
        // Updating the step by the voxel size
        // TODO: move this to a more elegant place
        advancedGUIControls.planeDistControl.step(currentImage.getVoxelWorldSize());
    }

    // If a label was defined, it takes precedence over the user-selected seeds for resuming
    if(imgInfo.label !== undefined)
    {
        readImageDataArray(imgInfo.label, loadLabelFile, {'key' : key, 'img_loaded': false, 'load_grad': imgInfo.grad});
    } else  if(imgInfo.seeds !== undefined) {
        readJsonFile(imgInfo.seeds, loadSeedsFile, {'key' : key, 'img_loaded': false});
    } else if(imgInfo.grad !== undefined) {
        readImageDataArray(imgInfo.grad, loadGradFile, {'key' : key, 'img_loaded': false});
    } else {
        imageSelection(key);
    }
}

function loadLabelFile(arrayBuffer, parameters) {
    var key 		= parameters['key'];
    var img_loaded 	= parameters['img_loaded'];
    var load_grad   = parameters['load_grad'];

    if(!img_loaded) {
        // IMPORTANT: the image has to be selected first, and then we load the label since the imageSelection procedure
        // clears the label
        imageSelection(key);
        img_loaded = true;
    }

    console.log('Loading label image for', key);

    currentImage.loadLabel(arrayBuffer);

    var A = null;

    if(iftIs3DImage(currentImage.label))
        A = iftSpheric(1.0);
    else
        A = iftCircular(1.5);
    console.log("currentImage.label", currentImage.label);
    var res 		    = selectLabels(currentImage.label, DISPLAY_ALL_LABEL_MESHES, A);
    var selectedLabels 	= res.selectedLabels;
    console.log(selectedLabels);
    //Updating the textures and meshes for display
    coseGUI.computeLabelTexturesAndMeshes(currentImage, delineationAlg.fst.A, guiParams.labelEroRadius,
        selectedLabels, null);


    /* Resuming segmentation by computing seeds at the geodesic centers of the regions.*/
    //TODO: use an improved segmentation resuming algorithm such as the one based on ISF/IFT-SLIC
    scribbleManager.loadScribblesFromJson(iftSeedsFromLabelAtGeodesicCenters(currentImage.label, 2.0));
    guiParams.operations = scribbleManager.getMode();

    if(load_grad !== undefined && load_grad !== null) {
        readImageDataArray(load_grad, loadGradFile, {'key': key, 'img_loaded': img_loaded});
    }
}

function loadGradFile(arrayBuffer, parameters) {
    var key 		= parameters['key'];
    var img_loaded 	= parameters['img_loaded'];

    console.log('Loading gradient image for', key);

    currentImage.loadGrad(arrayBuffer);

    if(!img_loaded) {
        // IMPORTANT: the gradient has to be loaded first, since the imageSelection procedure uses the gradient
        // to create the delineation algorithm
        imageSelection(key);
    }

}


function loadSeedsFile(text, parameters) {
    var key 		= parameters['key'];
    var img_loaded  = parameters['img_loaded'];
    var seeds = JSON.parse(text);
    var load_grad   = parameters['load_grad'];

    if(!img_loaded) {
        // IMPORTANT: the image has to be selected first, and then we load the label since the imageSelection procedure
        // clears the label
        imageSelection(key);
        img_loaded = true;
    }

    console.log('Loading seeds for', key);

    if(scribbleManager !== null) {
        console.log('Json seeds', seeds);

        scribbleManager.loadScribblesFromJson(seeds);
        guiParams.operations = scribbleManager.getMode();
    }

    if(load_grad !== undefined && load_grad !== null) {
        readImageDataArray(load_grad, loadGradFile, {'key': key, 'img_loaded': img_loaded});
    }
}

function imageSelection(value) {

    if(value.toLowerCase() === 'none')
        guiParams.curModel = null;
    else
        guiParams.curModel = value;

    // Clearing old scene
    clearScene();

    coseGUI = new CoseGUI();
    guiParams.clippingPlaneDir = coseGUI.clippingPlaneDir;

    coseGUI.container.appendChild( renderer.domElement );

    if(guiParams.curModel !== null) {
        // Recreating entire scene with the proper size
        createScene(currentImage);
    }

    onWindowResize();
}


/*****************************************************************************************************************/
/*												Mouse/keyboard input							  	 		 	 */
/*****************************************************************************************************************/


function setMouseHandler() {

    if(coseGUI !== null)
        coseGUI.enableCameraMotionHandler(true);

    setScribbleHandler(true);
}

function setScribbleHandler(value) {
    if (value) {
        if(scribbleManager !== null) {
            scribbleManager.start(coseGUI.container);
        }
    } else {
        if(scribbleManager !== null) {
            scribbleManager.stop(coseGUI.container);
        }
    }
}

function setKeyboardHandler(value) {
    if(value) {
        document.addEventListener("keydown", onDocumentKeyDown, false);
        document.addEventListener("keyup", onDocumentKeyUp, false);
    } else {
        document.removeEventListener("keydown", onDocumentKeyDown, false);
        document.removeEventListener("keyup", onDocumentKeyUp, false);
    }
}


function onDocumentKeyDown(event) {

    var OS = determineOs();

    if(event.keyCode === 90){
        if((OS === "MacOS" && event.metaKey) || (OS !== "MacOS" && event.ctrlKey)) {
            if(event.shiftKey)
                redo();
            else
                undo();
        }
    } else {
        if (scribbleManager !== null) {
            scribbleManager.setShiftKey(event.shiftKey);
            scribbleManager.setCmdKey(event.metaKey || event.ctrlKey);
        }
    }
}

function onDocumentKeyUp(event) {
    if(scribbleManager !== null) {
        scribbleManager.setShiftKey(event.shiftKey);
        scribbleManager.setCmdKey(event.metaKey || event.ctrlKey);
    }
}


/******************************************************************************************************************/
/*											Scene generation and display									  	  */
/******************************************************************************************************************/


function clearHandlers() {
    // Clearing the scribble handler and the corresponding scribble meshes
    if (scribbleManager !== null) {
        scribbleManager.clearHandler(coseGUI.getScene());
        setScribbleHandler(false);
        scribbleManager.setImage(currentImage);
    }

    setMouseHandler();
}

function createScene(cur_img_data) {

    if(cur_img_data !== null) {

        // Reallocating scribble handler and delineation algorithm
        scribbleManager 		= new ScribbleManager(cur_img_data, guiParams.scribbleRadius,
                                                        guiParams.scribbles3D, colorMapScribblesBin,
                                                        parseInt(guiParams.operations), delineate);

        if(cur_img_data.grad !== null) {
            console.log('grad is not null');
            delineationAlg			= new DelineationAlg(cur_img_data.grad, iftSpheric(1.0));
        } else {
            delineationAlg			= new DelineationAlg(cur_img_data.img, iftSpheric(1.0));
        }

        setMouseHandler();
        setKeyboardHandler(true);

        coseGUI.createScene(cur_img_data);
    }
}


function selectLabels(label, selLabel, A) {
    var selectedLabels = [];
    var adjacentLabels = [];

    if (selLabel >= 0) {
        adjacentLabels = iftAdjacentLabelsAndConnectionPoints(label, A);

        selectedLabels = [];

        for(var i = 0; i < adjacentLabels[selLabel].length; i++)
            selectedLabels.push(adjacentLabels[selLabel][i].label);

        selectedLabels.push(selLabel);

        // Eliminating the background label
        selectedLabels = selectedLabels.filter(function (value) {
            return value !== 0;
        });


    } else if (selLabel === DISPLAY_ALL_LABEL_MESHES) { // Selecting all available labels for display
        var max_lb = iftMaximumValue(label);
        var available_labels = iftAllocUCharArray(max_lb + 1);
        adjacentLabels = iftAdjacentLabelsAndConnectionPoints(label, A);

        for (var p = 0; p < label.n; p++) {
            available_labels[label.val[p]] = 1;
        }

        // Selecting all labels but eliminating the background one
        for (var lb = 1; lb <= max_lb; lb++) {
            if (available_labels[lb]) {
                selectedLabels.push(lb);
            }
        }
    }

    return {selectedLabels: selectedLabels, adjacentLabels: adjacentLabels};
}

function clearImageData(curSelImage) {
    if(curSelImage !== null) {
        currentImage.clearSegmentationData();
    }
}

function clearScene() {
    // Clearing specific data related to the image
    clearImageData(guiParams.curModel);

    // Clearing the current scribbles
    clearHandlers();

    // Disabling handlers until recreating the scene
    setKeyboardHandler(false);
    setScribbleHandler(false);

    if(coseGUI !== null) {
        coseGUI.enableCameraMotionHandler(false);

        coseGUI.clearScene();

        coseGUI = null;
    }

    renderer.clear(true, true, true);
}

function onWindowResize( event ) {
//        renderer.setSize( window.innerWidth, window.innerHeight );
//        renderer.setSize( 500, 500 );
    renderer.setSize( coseGUI.container.clientWidth, coseGUI.container.clientHeight );

    if(coseGUI !== null)
        coseGUI.handleResize();

    render();
}

function animate() {

    requestAnimationFrame( animate );

    if(coseGUI !== null)
        coseGUI.updateMotionHandler();

    render();
}

function render() {
    var curSelImage = guiParams.curModel;
    if (curSelImage !== null && coseGUI !== null) {
        var boxDiagSize = currentImage.getBoxDiagonalSize();
        var voxelSize = currentImage.getVoxelWorldSize();

        coseGUI.updateClippingPlane(boxDiagSize);

        coseGUI.updateForRendering(currentImage);

        scribbleManager.updateScribbleMeshes(guiParams.showScribbles, coseGUI.clippingPlane, colorMapScribblesBin,
            NORMAL_ANGLE_VISIB_TOLERANCE, voxelSize / 2.0);


        if (coseGUI.sceneFirstPass !== null && coseGUI.getScene() !== null) {

            //Render first pass and store the world space coords of the back face fragments into the texture.
            renderer.render(coseGUI.sceneFirstPass, coseGUI.camera, coseGUI.firstPassImgTexture, true);

            //Render the second pass and perform the volume rendering.
            renderer.render(coseGUI.getScene(), coseGUI.camera);
        }
    }
}

/******************************************************************************************************************/
/*									    			Image delineation									  	 	  */
/******************************************************************************************************************/


function determineModifiedLabels(old_label, new_label) {
    var mod_labels = [];


    var max_lb = Math.max(iftMaximumValue(old_label), iftMaximumValue(new_label));
    var modified_labels = iftAllocUCharArray(max_lb + 1);

    for (var p = 0; p < new_label.n; p++) {
        if (old_label.val[p] !== new_label.val[p]) {
            // Since the old label was modified, we have to add it to the new labels array for re-computing
            // its mesh
            modified_labels[new_label.val[p]] = 1;
            modified_labels[old_label.val[p]] = 1;
        }
    }

    for (var lb = 1; lb <= max_lb; lb++) {
        if (modified_labels[lb] > 0) {
            mod_labels.push(lb);
        }
    }

    return mod_labels;
}

function delineate() {
    if(scribbleManager !== null) {
        var res = scribbleManager.scribblesToSeeds(delineationAlg.checkpoint, IFT_INFINITY_INT);
        var seeds = res.seeds, remSeeds;

        res = scribbleManager.scribblesSelectedForRemovalToSeeds();
        remSeeds = res.seeds;

        // Delineating
        delineationAlg.delineate(seeds, remSeeds);
        // Setting checkpoint
        delineationAlg.checkpoint = scribbleManager.mk_id;

        // Clearing markers selected for removal
        scribbleManager.clearScribblesSelectedForRemoval(coseGUI.getScene());

        var modified_labels = determineModifiedLabels(currentImage.label, delineationAlg.fst.label);

        // Copying delineation result to the image in the currentImage structure
        iftCopyImageInplace(delineationAlg.fst.label, currentImage.label);

        // Updating the textures and meshes for display
        coseGUI.computeLabelTexturesAndMeshes(currentImage, delineationAlg.fst.A, guiParams.labelEroRadius,
            modified_labels, modified_labels);

        // Counting each delineation call as one user interaction
        numInteractions++;
    }
}

function resetDelineation() {
    // Resetting
    delineationAlg.reset();

    // Copying delineation result to the image in the currentImage structure
    iftCopyImageInplace(delineationAlg.fst.label, currentImage.label);

    // Updating the textures and meshes for display
    coseGUI.computeLabelTexturesAndMeshes(currentImage, delineationAlg.fst.A, guiParams.labelEroRadius, [], null);
}

function undo() {
    if(scribbleManager !== null) {
        scribbleManager.undo(true);
    }
}

function redo() {
    if(scribbleManager !== null) {
        scribbleManager.redo(true);
    }
}
