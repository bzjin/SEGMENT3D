/**
 * Created by tvspina on 3/17/17.
 */

function planeToVec4(plane) {
    return new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
}

function CoseGUI() {
    this.camera 		        = null;
    this.cameraMotionHandler 	= null;
    this.cameraOrthoFactor      = 1.0;
    this.cameraFocus            = null;

    this.lightCamera        = null;

    this.meshFirstPass 		= null;
    this.meshSecondPass 	= null;
    this.meshBoxWireframe   = null;
    this.meshPlaneLines		= null;
    this.meshLabels         = [];

    this.adjacentLabels = [];

    this.sceneFirstPass 	= null;
    this.sceneSecondPass 	= null;
    this.firstPassImgTexture 	= null;

    this.clippingPlaneDir 		= CLIPPING_PLANE_DIR_NEG;
    this.clippingPlane 			= new THREE.Plane(new THREE.Vector3( 0.0, 0.0, -1.0), 0.0);

    this.container = document.getElementById('container');

    // this.stats = new Stats();
    // this.stats.domElement.style.position = 'relative';
    // this.stats.domElement.style.top = '0px';
    // this.container.appendChild( this.stats.domElement );

    this.transferTexture      = this.computeTransferFunction(guiParams.transfColor0, guiParams.transfColor1,
        guiParams.transfColor2);

    // Using at most 256 colors to label the objects
    this.labelTransferTexture = this.computeLabelTransferFunction(colorMap1024.colormap.slice(0, MAX_NUM_OBJECTS));

    this.borderTexture = null;
    this.labelTexture  = null;

    this.createCameraAndMotionHandler(true);

    this.box_x_color = 0xFF0000;
    this.box_y_color = 0xFF0000;
    this.box_z_color = 0xFF0000;

    this.axis_x_color = 0xFF0000;
    this.axis_y_color = 0x0000FF;
    this.axis_z_color = 0xFF00FF;

    this.plane_color = 0xFFFF00;
}

CoseGUI.prototype.getScene = function() {
    return this.sceneSecondPass;
};

CoseGUI.prototype.createScene = function (img_data) {
    if(img_data !== null) {
        // Calculating the box dimensions from the texture (image) size
        var boxDimensions   = img_data.getBoxDimensions();
        var boxDiagSize     = img_data.getBoxDiagonalSize();
        var xfactor         = boxDimensions[0], yfactor = boxDimensions[1], zfactor = boxDimensions[2];
        var xslices	        = img_data.texture.xslices;
        var context_border  = img_data.getTileContextBorder();

        this.sceneFirstPass = new THREE.Scene();
        this.sceneSecondPass = new THREE.Scene();

        this.setCameraFocus(false);

        this.updateClippingPlane(boxDiagSize);

        this.firstPassImgTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                format: THREE.RGBFormat,
                type: THREE.UnsignedByteType,
                generateMipmaps: false
            });


        var materialFirstPass = new THREE.ShaderMaterial({
            vertexShader: document.getElementById('vertexShaderFirstPass').textContent,
            fragmentShader: document.getElementById('fragmentShaderFirstPass').textContent,
            side: THREE.BackSide,
            uniforms: {
                xfactor: {type: "1f", value: xfactor},
                yfactor: {type: "1f", value: yfactor},
                zfactor: {type: "1f", value: zfactor}
            }
        });

        var __ret           = this.getOverlayTextures(img_data);
        var overlay 		= __ret.overlay;
        var borderTexture 	= __ret.borderTexture;
        var labelTexture 	= __ret.labelTexture;

        var materialSecondPass = new THREE.ShaderMaterial({
            depthWrite: false,
            transparent: true,
            opacity: 1.0,

            vertexShader: document.getElementById('vertexShaderSecondPass').textContent,
            fragmentShader: this.getFragmentShaderSecondPass(optimize_for_mobile),
            side: THREE.FrontSide,
            uniforms: {
                tex: {type: "t", value: this.firstPassImgTexture.texture},
                imgTex: {type: "t", value: img_data.texture},
                borderTex: {type: "t", value: borderTexture},
                labelTex: {type: "t", value: labelTexture},
                overlay: {type: "i", value: overlay},
                transferTex: {type: "t", value: this.transferTexture},
                labelTransferTex: {type: "t", value: this.labelTransferTexture},

                useLogTransfFunction: {type: "i", value: guiParams.useLogTransfFunction},
                k_logFun: {type: "1f", value: guiParams.k_logFun},
                x0_logFun: {type: "1f", value: guiParams.x0_logFun},

                steps: {type: "1f", value: guiParams.steps},
                alphaCorrection: {type: "1f", value: guiParams.alphaCorrection},
                alphaLabelCorrection: {type: "1f", value: guiParams.alphaLabelCorrection},
                borderThresh: {type: "1f", value: guiParams.borderThresh},
                overlayDepth: {type: "1f", value: img_data.getVoxelWorldSize()},
                zsize: {type: "1f", value: img_data.texture.zsize},
                xfactor: {type: "1f", value: xfactor},
                yfactor: {type: "1f", value: yfactor},
                zfactor: {type: "1f", value: zfactor},
                xslices: {type: "1f", value: xslices},
                yslices: {type: "1f", value: Math.ceil(img_data.texture.zsize / xslices)},

                clippingPlane: {type: "v4", value: planeToVec4(this.clippingPlane)},

                borderColor: {type: "v3", value: hexToRgb(guiParams.borderColor[1])},
                overlayAlpha: {type: "f", value: guiParams.overlayAlpha},
                intensity_as_alpha: {type: "f", value: (guiParams.intensity_as_alpha) ? 1.0 : 0.0},

                work_border_x: {type: "f", value: context_border},
                work_border_y: {type: "f", value: context_border},
                work_border_z: {type: "f", value: context_border},
                work_border_alpha: {type: "f", value: CONTEXT_BORDER_ALPHA},

                gammaCorrection: {type: "f", value: guiParams.gammaCorrection}
            }
        });

        // Defining the box geometry used to display the volume
        var boxGeometry = new THREE.BoxGeometry(xfactor, yfactor, zfactor);
        boxGeometry.doubleSided = true;

        this.meshFirstPass = new THREE.Mesh(boxGeometry, materialFirstPass);
        this.meshSecondPass = new THREE.Mesh(boxGeometry, materialSecondPass);

        // Drawing a wireframe around the box onto which the volume is drawn as a texture
        this.meshBoxWireframe = this.createBoxMesh(xfactor, yfactor, zfactor, 3.0);

        this.axes = this.createAxesMesh(0.2, 3.0);

        this.createPlaneMesh();

        // Creating a light that emanates from the camera direction
        if(this.lightCamera !== null)
            this.camera.remove(this.lightCamera);

        //Creating an ambient light to equally illuminate all objects in the scene
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.lightCamera = new THREE.DirectionalLight(0xffffff);

        var cameraDir = this.camera.getWorldDirection();
        this.lightCamera.position.set(cameraDir.x, cameraDir.y, cameraDir.z);
        this.camera.add(this.lightCamera);

        this.sceneSecondPass.add(this.camera);
        this.sceneSecondPass.add(ambientLight);

        this.sceneFirstPass.add(this.meshFirstPass);
        this.sceneSecondPass.add(this.meshSecondPass);
        this.sceneSecondPass.add(this.meshBoxWireframe);

        this.sceneSecondPass.add(this.axes);
    }
};


CoseGUI.prototype.getFragmentShaderSecondPass = function(optimize_for_mobile) {
    var shader_txt = document.getElementById('fragmentShaderSecondPass').textContent;
    var header_txt = '#define NO_OVERLAY ' + NO_OVERLAY + '\n';

    header_txt += '#define LABEL_OVERLAY ' + LABEL_OVERLAY + '\n';
    header_txt += '#define BORDER_OVERLAY ' + BORDER_OVERLAY + '\n';
    header_txt += '#define BORDER_LABEL_OVERLAY ' + BORDER_LABEL_OVERLAY + '\n';

    if(optimize_for_mobile) {
        header_txt += '#define MOBILE_OPTIMIZATIONS\n';
    }

    return header_txt + shader_txt;
};

CoseGUI.prototype.setAdjacentLabels = function(adjacentLabels) {
    this.adjacentLabels = adjacentLabels;
};

CoseGUI.prototype.clearScene = function() {
    // Clearing old label meshes
    this.clearLabelMeshes(null);

    this.setCameraFocus(false);

    // Clearing old image texture-related meshes
    this.clearImageTextureMeshes();
};

CoseGUI.prototype.clearImageTextureMeshes = function () {
    var i;

    if (this.sceneFirstPass !== null) {
        if (this.meshFirstPass !== null) {
            this.sceneFirstPass.remove(this.meshFirstPass);
            this.meshFirstPass.geometry.dispose();
            this.meshFirstPass.material.dispose();
        }

    }
    if (this.sceneSecondPass !== null) {
        if (this.meshBoxWireframe !== null) {
            this.sceneSecondPass.remove(this.meshBoxWireframe);

            for(i = 0; i < this.meshBoxWireframe.children.length; i++) {
                this.meshBoxWireframe.children[i].geometry.dispose();
                this.meshBoxWireframe.children[i].material.dispose();
            }
        }
        if (this.axes !== null) {
            this.sceneSecondPass.remove(this.axes);
        }

        this.setImageLabelBorderTexture(null, null);
        this.setImageLabelTexture(null, null);

        // Clearing label plane mesh
        this.clearPlaneMesh();

        if (this.meshSecondPass !== null) {
            this.sceneSecondPass.remove(this.meshSecondPass);
            // The geometry used by this.meshSecondPass is the same used by this.meshFirstPass and was disposed already
            // TODO: figure out why transparency fails for meshBoxWireframe when disposing this.meshSecondPass.material
            // this.meshSecondPass.material.dispose();
        }

        for(i = 0; i < this.sceneSecondPass.children.length; i++) {
            this.sceneSecondPass.remove(this.sceneSecondPass.children[i]);
        }
    }

    if(this.firstPassImgTexture !== null)
        this.firstPassImgTexture.dispose();

    this.firstPassImgTexture = null;
    this.meshFirstPass = null;
    this.meshSecondPass = null;
    this.meshBoxWireframe = null;
    this.meshPlaneLines   = null;
    this.axes = null;
    this.sceneSecondPass = null;
    this.sceneFirstPass = null;
};


CoseGUI.prototype.updateMotionHandler = function() {
    this.cameraMotionHandler.update();

    // this.stats.update();
};

CoseGUI.prototype.handleResize = function() {
    // var aspect = window.innerWidth / window.innerHeight;
    var aspect = this.container.clientWidth / this.container.clientHeight;

    if(this.camera.isOrthographicCamera) {
        this.camera.bottom	= -this.cameraOrthoFactor;
        this.camera.top		= this.cameraOrthoFactor;
        this.camera.left	= -aspect*this.cameraOrthoFactor;
        this.camera.right	= aspect*this.cameraOrthoFactor;
    }

    this.camera.aspect = aspect;

    this.camera.updateProjectionMatrix();

    this.cameraMotionHandler.handleResize();
};

CoseGUI.prototype.computeTransferFunction = function(color0, color1, color2)
{
    var num_colors = 256;
    var height = 4;
    var transfRGBA = new Uint8Array(height * 4 * num_colors);

    // Computing a linear gradient between the three selected transfer function colors
    for(var i=0; i < num_colors * height; i++){
        var j = iftSafeMod(i, num_colors);
        var rgb, lambda;

        if(j < num_colors / 2) {
            // Linear interpolation
            lambda = j / (num_colors / 2 - 1);
            rgb = color0.clone().lerp(color1, lambda);
        } else {
            // Linear interpolation
            lambda = (j - (num_colors / 2 - 1)) / (num_colors / 2);
            rgb = color1.clone().lerp(color2, lambda);
        }

        // RGB from 0 to 255
        transfRGBA[4*i] 		= rgb.r * (num_colors - 1);
        transfRGBA[4*i + 1] 	= rgb.g * (num_colors - 1);
        transfRGBA[4*i + 2] 	= rgb.b * (num_colors - 1);
        // OPACITY
        transfRGBA[4*i + 3] 	= (num_colors - 1);
    }

    var transferTexture =  new THREE.DataTexture( transfRGBA, num_colors, height, THREE.RGBAFormat );
    transferTexture.needsUpdate = true;

    return transferTexture;
};

CoseGUI.prototype.computeLabelTransferFunction = function(colormap)
{
    var height = 4;
    var labelRGBA = new Uint8Array(height * 4 * colormap.length);

    for(var i=0; i < colormap.length * height; i++){
        var j = iftSafeMod(i, colormap.length);
        var rgb = hexToRgb(colormap[j]);

        // RGB from 0 to 255
        labelRGBA[4*i] 		= rgb.r;
        labelRGBA[4*i + 1] 	= rgb.g;
        labelRGBA[4*i + 2] 	= rgb.b;
        // OPACITY
        labelRGBA[4*i + 3] = 255;
    }

    var labelTransferTexture =  new THREE.DataTexture( labelRGBA, colormap.length, height, THREE.RGBAFormat );
    labelTransferTexture.needsUpdate = true;

    return labelTransferTexture;
};


CoseGUI.prototype.createCameraAndMotionHandler = function(orthographic) {

    var aspect = window.innerWidth / window.innerHeight;

    var bottom	= -this.cameraOrthoFactor;
    var top		= this.cameraOrthoFactor;
    var left	= -aspect*top;
    var right	= aspect*top;

    if(orthographic)
        this.camera = new THREE.OrthographicCamera( left, right, bottom, top, 0.01, 3000.0);
    else
        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.001, 1000);


    this.camera.position.set(1, -1, -3);
    this.camera.up.set(0, -1, 0);

    this.createMotionHandler();

    cameraFocus = this.cameraMotionHandler.target.clone();
};


CoseGUI.prototype.createMotionHandler = function() {
    this.cameraMotionHandler = new THREE.CustomOrthographicTrackballControls(this.camera, this.container);
    this.cameraMotionHandler.target.set(0.0, 0.0, 0.0);

    this.cameraMotionHandler.rotateSpeed = 5.0;
    this.cameraMotionHandler.zoomSpeed = 1.5;
    this.cameraMotionHandler.panSpeed = 0.8;
    this.cameraMotionHandler.noPan = true;
    this.cameraMotionHandler.noZoom = true;
    this.cameraMotionHandler.staticMoving = true;
    this.cameraMotionHandler.dynamicDampingFactor = 0.3;

    this.cameraMotionHandler.addEventListener('change', render);
    this.cameraMotionHandler.update();
};

CoseGUI.prototype.changeOrthogonalCameraView = function(value) {
    value = parseInt(value);

    if(value === XY_PLANE) {
        this.camera.position.set(0, 0, -3);
        this.camera.up.set(0, -1, 0);
    } else if(value === XZ_PLANE) {
        this.camera.position.set(0, -3, 0);
        this.camera.up.set(0, 0, -1);
    } else {
        this.camera.position.set(-3, 0, 0);
        this.camera.up.set(0, 0, -1);
    }

    this.cameraMotionHandler.update();
    // Updating the clipping plane since the camera view changed
    var boxDiagSize = currentImage.getBoxDiagonalSize();
    this.updateClippingPlane();
};

CoseGUI.prototype.enableCameraMotionHandler = function (value) {
    this.cameraMotionHandler.noPan = true;
    this.cameraMotionHandler.noZoom = true;
    this.cameraMotionHandler.noRotate = !value;
};

CoseGUI.prototype.setCameraFocus = function (keep_dist_to_plane_constant) {
    if(guiParams.curModel !== null) {
        var max_dist = currentImage.getBoxDiagonalSize();
        var selLabelCenterWorld = this.updateSelectedLabelCenterWorld(parseInt(guiParams.selLabels[0]));
        var cameraFocus;

        if (selLabelCenterWorld === null) {
            cameraFocus = new THREE.Vector3(0.0,0.0,0.0);

        } else {
            cameraFocus = selLabelCenterWorld.clone();
        }

        if(keep_dist_to_plane_constant) {
            var new_distance_to_clipping_plane = this.clippingPlane.distanceToPoint(cameraFocus);

            guiParams.planeDist = (new_distance_to_clipping_plane / max_dist) * 2.0;
        }

        this.cameraFocus = cameraFocus;


        // Pointing camera
        this.camera.lookAt(cameraFocus);
        this.cameraMotionHandler.target.set(cameraFocus.x, cameraFocus.y, cameraFocus.z);
        this.cameraMotionHandler.update();
    }
};


CoseGUI.prototype.getOverlayTextures = function(img_data) {
    var overlay = parseInt(guiParams.overlay);
    var borderTexture = img_data.texture;
    var labelTexture = img_data.texture;

    if (overlay === LABEL_OVERLAY || overlay == BORDER_LABEL_OVERLAY) {
        if (this.labelTexture !== undefined && this.labelTexture !== null) {
            labelTexture = this.labelTexture;
        } else {
            overlay = 0;
        }
    }

    if (overlay === BORDER_OVERLAY || overlay === BORDER_LABEL_OVERLAY) {
        if (this.borderTexture !== undefined && this.borderTexture !== null) {
            borderTexture = this.borderTexture;
        } else {
            overlay = 0;
        }
    }

    return {overlay: overlay, borderTexture: borderTexture, labelTexture: labelTexture};
};

CoseGUI.prototype.createBoxMesh = function( xfactor, yfactor, zfactor, linewidth) {
    var box = new THREE.Object3D();
    var origin = new THREE.Vector3(0, 0, 0);
    var points;

    var materialLines = new THREE.LineBasicMaterial({color: this.box_x_color, linewidth:linewidth});
    var geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x - xfactor / 2, origin.y - yfactor / 2, origin.z - zfactor / 2),
        new THREE.Vector3( origin.x + xfactor / 2, origin.y - yfactor / 2, origin.z - zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x - xfactor / 2, origin.y + yfactor / 2, origin.z - zfactor / 2),
        new THREE.Vector3( origin.x + xfactor / 2, origin.y + yfactor / 2, origin.z - zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x - xfactor / 2, origin.y - yfactor / 2, origin.z + zfactor / 2),
        new THREE.Vector3( origin.x + xfactor / 2, origin.y - yfactor / 2, origin.z + zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x - xfactor / 2, origin.y + yfactor / 2, origin.z + zfactor / 2),
        new THREE.Vector3( origin.x + xfactor / 2, origin.y + yfactor / 2, origin.z + zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));


    materialLines = new THREE.LineBasicMaterial({color: this.box_y_color, linewidth:linewidth});
    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x - xfactor / 2, origin.y - yfactor / 2, origin.z - zfactor / 2),
        new THREE.Vector3( origin.x - xfactor / 2, origin.y + yfactor / 2, origin.z - zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x + xfactor / 2, origin.y - yfactor / 2, origin.z - zfactor / 2),
        new THREE.Vector3( origin.x + xfactor / 2, origin.y + yfactor / 2, origin.z - zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x - xfactor / 2, origin.y - yfactor / 2, origin.z + zfactor / 2),
        new THREE.Vector3( origin.x - xfactor / 2, origin.y + yfactor / 2, origin.z + zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x + xfactor / 2, origin.y - yfactor / 2, origin.z + zfactor / 2),
        new THREE.Vector3( origin.x + xfactor / 2, origin.y + yfactor / 2, origin.z + zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));


    materialLines = new THREE.LineBasicMaterial({color: this.box_z_color, linewidth:linewidth});
    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x - xfactor / 2, origin.y - yfactor / 2, origin.z - zfactor / 2),
        new THREE.Vector3( origin.x - xfactor / 2, origin.y - yfactor / 2, origin.z + zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x + xfactor / 2, origin.y - yfactor / 2, origin.z - zfactor / 2),
        new THREE.Vector3( origin.x + xfactor / 2, origin.y - yfactor / 2, origin.z + zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x - xfactor / 2, origin.y + yfactor / 2, origin.z - zfactor / 2),
        new THREE.Vector3( origin.x - xfactor / 2, origin.y + yfactor / 2, origin.z + zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    geometry = new THREE.Geometry();
    points = [new THREE.Vector3( origin.x + xfactor / 2, origin.y + yfactor / 2, origin.z - zfactor / 2),
        new THREE.Vector3( origin.x + xfactor / 2, origin.y + yfactor / 2, origin.z + zfactor / 2)];
    geometry.vertices = points;
    box.add(new THREE.Line(geometry, materialLines));

    return box;
};

CoseGUI.prototype.createPlaneMesh = function() {
    // Computing the bounding box of the current image texture relative to the camera focus
    var bb_world = currentImage.bb_world;

    var points = calcPointsInPlaneBoundingBoxIntersection(this.clippingPlane, bb_world.begin, bb_world.end);

    if (points.length > 0) {
        var materialLine = new THREE.LineBasicMaterial({color: this.plane_color, linewidth: 2});
        var geometryLines = new THREE.Geometry();
        // Adding the first point after the last one, to ensure that the polygon will be closed by drawing a line
        // between the first and last
        for (var i = 0; i < points.length + 1; i++) {
            var v = new THREE.Vector3(points[i % points.length].x, points[i % points.length].y, points[i % points.length].z);

            geometryLines.vertices.push(v);
        }

        this.meshPlaneLines = new THREE.Line(geometryLines, materialLine);


        this.getScene().add(this.meshPlaneLines);
    }
};


CoseGUI.prototype.clearPlaneMesh = function() {
    // Removing old clipping plane lines mesh and adding a new one
    if (this.meshPlaneLines !== null) {
        this.getScene().remove(this.meshPlaneLines);
        this.meshPlaneLines.geometry.dispose();
        this.meshPlaneLines.material.dispose();
        this.meshPlaneLines = null;
    }
};


CoseGUI.prototype.createAxesMesh = function( length, linewidth ) {
    var axes = new THREE.Object3D();
    var origin = new THREE.Vector3(0, 0, 0);
    var helper;

    // Creating arrows to represent axes
    helper = new THREE.ArrowHelper(new THREE.Vector3( origin.x + length, origin.y, origin.z ).normalize(), origin,
        length, this.axis_x_color, 0.2*length, 0.1*length);
    helper.line.material.linewidth = linewidth;

    axes.add( helper );

    helper = new THREE.ArrowHelper(new THREE.Vector3( origin.x, origin.y + length, origin.z ).normalize(), origin,
        length, this.axis_y_color, 0.2*length, 0.1*length);
    helper.line.material.linewidth = linewidth;
    axes.add( helper );

    helper = new THREE.ArrowHelper(new THREE.Vector3( origin.x, origin.y, origin.z + length ).normalize(), origin,
        length, this.axis_z_color, 0.2*length, 0.1*length);
    helper.line.material.linewidth = linewidth;
    axes.add( helper );

    axes.plane_arrow = new THREE.ArrowHelper(this.clippingPlane.normal.clone(), origin,
        length, this.plane_color, 0.2*length, 0.1*length);
    axes.plane_arrow.line.material.linewidth = linewidth;


    axes.xtext = new THREE.Mesh(new THREE.TextGeometry('x', {font: font, size: 0.1*length, height: 0.1*length}),
        new THREE.MeshBasicMaterial({color: this.axis_x_color}));
    axes.xtext.position.set(origin.x + length*1.1, origin.y, origin.z);

    axes.ytext = new THREE.Mesh(new THREE.TextGeometry('y', {font: font, size: 0.1*length, height: 0.1*length}),
        new THREE.MeshBasicMaterial({color: this.axis_y_color}));
    axes.ytext.position.set(origin.x, origin.y + length*1.1, origin.z);


    axes.ztext = new THREE.Mesh(new THREE.TextGeometry('z', {font: font, size: 0.1*length, height: 0.1*length}),
        new THREE.MeshBasicMaterial({color: this.axis_z_color}));
    axes.ztext.position.set(origin.x, origin.y, origin.z + length*1.1);


    // Rotating about the z axis because we use image coordinates
    axes.xtext.rotation.z = Math.PI;
    axes.ytext.rotation.z = Math.PI;
    axes.ztext.rotation.z = Math.PI;

    // Updating the up direction accordingly to ensure that the .lookAt method works as expected
    axes.xtext.up.set(0, -1, 0);
    axes.ytext.up.set(0, -1, 0);
    axes.ztext.up.set(0, -1, 0);

    axes.add(axes.xtext);
    axes.add(axes.ytext);
    axes.add(axes.ztext);

    // Creating clipping plane geometry
    var materialLine = new THREE.LineBasicMaterial({color: this.plane_color, linewidth: linewidth});
    var geometryLines = new THREE.Geometry();

    var points = [new THREE.Vector3(-length/2, -length/2, 0), new THREE.Vector3(length/2, -length/2, 0), new THREE.Vector3(length/2, length/2, 0),
        new THREE.Vector3(-length/2, length/2, 0)];

    // Adding the first point after the last one, to ensure that the polygon will be closed by drawing a line
    // between the first and last
    for (var i = 0; i < points.length + 1; i++) {
        var v = new THREE.Vector3(points[i % points.length].x, points[i % points.length].y, points[i % points.length].z);

        geometryLines.vertices.push(v);
    }

    var mesh = new THREE.Line(geometryLines, materialLine);
    mesh.lookAt(this.clippingPlane.normal);

    axes.plane = mesh;


    axes.add(axes.plane);
    axes.add(axes.plane_arrow);

    return axes;
};


// CoseGUI.prototype.forceLabelMeshVisibility = function(labels) {
//     // Resetting visibility for all labels
//     for(var i = 0; i < this.meshLabels.length; i++) {
//         this.meshLabels[i].forceVisibility = VISIBILITY_CUSTOM;
//     }
//
//     this.selectLabelsForDisplay(labels);
//
//     // Forcing selected label to be in display
//     for(var i = 0; i < this.meshLabels.length; i++) {
//         this.meshLabels[i].forceVisibility = (labels.indexOf(this.meshLabels[i].label) >= 0) ? VISIBILITY_ALWAYS : VISIBILITY_CUSTOM;
//     }
// };

CoseGUI.prototype.computeLabelGeometries = function(label, selectedLabels) {
    var labelGeometries = [];
    var isolevel = 1;

    // The values of triangles located on the border of the image should be outside the label. This is
    // important to ensure the aforementioned property of border labels. Hence, we compute the maximum dimension
    // on the original image, without frame
    var frame = 1;


    // Adding a frame around the label of 1 voxel to ensure that labels on the border of the image have a
    // closed surface
    var labelFrame = iftAddFrame(label, frame, 0);
    // The center to be considered for calculating the triangles corresponds to the image with the added frame
    var centerFrame          = getImageCenterFloat(labelFrame);

    for (var i = 0; i < selectedLabels.length; i++) {
        var lb = selectedLabels[i];

        // Masking the label of interest
        var mask = iftThreshold(labelFrame, lb, lb, isolevel);

        // It might occur that the selected label is no longer present in the segmentation, since it might have
        // been excluded. Hence, we ensure that the mask has some positive value before computing the Marching Cubes
        // algorithm.
        if(iftMaximumValue(mask) > 0) {
            // Computing the bounding box ange geometric center
            var bb_label 	= iftMinBoundingBox(mask)[0];
            var geom_center = iftGeometricCenter(mask);

            // Computing the geometry using marching cubes
            var geometry = marchingCubes(mask, bb_label, isolevel, centerFrame, currentImage);

            laplacianSmoothing(geometry.attributes.position.array, geometry.index.array, 2, 1.0);

            geometry.computeVertexNormals();
            geometry.computeBoundingBox();

            // Converting the geometric center to world coordinates
            geom_center = currentImage.imageCoordsToWorldCoords(geom_center, centerFrame);

            /* Adding a label field to geometry as well as the geometric center of the label in*/ geometry.label = lb;
            geometry.geom_center_world = geom_center;

//                var modifier = new THREE.SimplifyModifier();
//                console.time('simplify');
//                var simplified = modifier.modify(geometry, Math.floor((geometry.attributes.position.array.length / 3) * 0.6));
//                simplified.label = lb;
//                simplified.geom_center_world = geom_center;
//                simplified.computeFaceNormals();
//                simplified.computeVertexNormals();
//                simplified.computeBoundingBox();
//                console.timeEnd('simplify');


            labelGeometries.push(geometry);
        }
    }


    return labelGeometries;
};

CoseGUI.prototype.computeLabelMeshes = function(label, selectedLabels) {
    if (selectedLabels.length > 0) {
        var labelGeometries = this.computeLabelGeometries(label, selectedLabels);

        this.createLabelMeshes(labelGeometries, false);
    }

    // this.setCameraFocus(true);
};

CoseGUI.prototype.computeBorderMesh = function(border) {
    var labelGeometries = this.computeLabelGeometries(border, [iftMaximumValue(border)]);
    labelGeometries[0].label = BORDER_LABEL_ID;

    this.createLabelMeshes(labelGeometries, true);

    // this.setCameraFocus(true);
};

CoseGUI.prototype.computeLabelTexturesAndMeshes = function(img_data, Aseg, labelEroRadius, selectedLabels, oldLabelsToClear) {
    var origLabel = img_data.label;
    var displayLabel = origLabel;
    // Computing the set of boundary voxels including those from the background, but excluding the voxels on
    // the image's border
    var borderSetWithBkg = iftObjectBorderSet(origLabel, Aseg, true, false);
    var S, borderSetWithoutBkg = null;

    for(S = borderSetWithBkg; S !== null; S = S.next) {
        if(S.label !== 0)
            borderSetWithoutBkg = iftInsertLabeledSet(borderSetWithoutBkg, S.elem, S.label);
    }

    // Eroding labels if necessary
    if (labelEroRadius > 0.0) {
        var A = null;

        if (iftIs3DImage(origLabel))
            A = iftSpheric(1.0);
        else
            A = iftCircular(1.5);

        // Eroding each label
        displayLabel = iftErodeIndividualLabels(origLabel, labelEroRadius, A, borderSetWithoutBkg);
    }

    // Updating delineation result (label meshes and border texture)
    var border = iftCreateImage(displayLabel.xsize, displayLabel.ysize, displayLabel.zsize);
    iftCopyVoxelSize(displayLabel, border);

    // Setting border image with the border voxels
    S = borderSetWithoutBkg;
    while (S !== null) {
        border.val[S.elem] = 255;
        S = S.next;
    }


    this.setImageLabelBorderTexture(img_data, border);
    this.setImageLabelTexture(img_data, displayLabel);

    var oldLabelsToClearCpy = null;
    // Adding the border label for removal if there was a label change (in which case, oldLabelsToClear will not
    // be null). Otherwise, border label will be set to null and all labels, including the border, must be removed.
    if(oldLabelsToClear !== null) {
        oldLabelsToClearCpy = oldLabelsToClear.slice();
        oldLabelsToClearCpy.push(BORDER_LABEL_ID);
    } else {
        oldLabelsToClearCpy = null;
    }

    this.clearLabelMeshes(oldLabelsToClearCpy);

    this.computeLabelMeshes(displayLabel, selectedLabels);

    iftSetImage(border, 0);

    // Setting border image with the border voxels
    S = borderSetWithBkg;
    while (S !== null) {
        border.val[S.elem] = 255;
        S = S.next;
    }

    if(borderSetWithBkg !== null) {
        this.computeBorderMesh(border);
    }

    // Determining all labels that are adjacent, after the labels are updated since clearLabelMeshes
    // clears adjacentLabels. NOTE: it has to be done in the original image, since the
    // displayLabel may have been eroded
    this.setAdjacentLabels(iftAdjacentLabelsAndConnectionPointsSet(origLabel, Aseg, borderSetWithoutBkg));
};

CoseGUI.prototype.setImageLabelBorderTexture = function(img, border) {
    if (img !== null && border !== null) {
        var mosaic = iftSceneToSliceMosaic(border, img.texture.xslices);

        var bytes = iftAllocUCharArray(mosaic.n);

        for (var p = 0; p < mosaic.n; p++) {
            bytes[p] = mosaic.val[p];
        }

        this.borderTexture = new THREE.DataTexture(bytes, mosaic.xsize, mosaic.ysize, THREE.LuminanceFormat,
            THREE.UnsignedByteType, img.texture.mapping, img.texture.wrapS,
            img.texture.wrapT);

        this.borderTexture.generateMipmaps 	= false;
        this.borderTexture.minFilter 		= THREE.NearestFilter;
        this.borderTexture.magFilter 		= THREE.NearestFilter;
        this.borderTexture.xsize 			= img.texture.xsize;
        this.borderTexture.ysize 			= img.texture.ysize;
        // The depth of the borderTexture should consider the extra Z slices that were added when mosaicing the image
        this.borderTexture.zsize 			= img.texture.zsize;
        this.borderTexture.xslices 			= img.texture.xslices;

        // Flipping Y coordinates to match the world's orientation
        this.borderTexture.flipY 			= true;
        this.borderTexture.needsUpdate		= true;
    } else {
        this.borderTexture = null;
    }

    if(this.meshSecondPass !== null && this.borderTexture !== null)
        this.meshSecondPass.material.uniforms.borderTex.value = this.borderTexture;
};

CoseGUI.prototype.setImageLabelTexture = function(img, label) {
    if (img !== null && label !== null) {
        var mosaic = iftSceneToSliceMosaic(label, img.texture.xslices);

        var bytes = iftAllocUCharArray(mosaic.n);

        for (var p = 0; p < mosaic.n; p++) {
            bytes[p] = mosaic.val[p];
        }

        this.labelTexture = new THREE.DataTexture(bytes, mosaic.xsize, mosaic.ysize, THREE.LuminanceFormat,
            THREE.UnsignedByteType, img.texture.mapping, img.texture.wrapS,
            img.texture.wrapT);

        this.labelTexture.generateMipmaps 	= false;
        this.labelTexture.minFilter 		= THREE.NearestFilter;
        this.labelTexture.magFilter 		= THREE.NearestFilter;
        this.labelTexture.xsize 			= img.texture.xsize;
        this.labelTexture.ysize 			= img.texture.ysize;
        // The depth of the labelTexture should consider the extra Z slices that were added when mosaicing the image
        this.labelTexture.zsize 			= img.texture.zsize;
        this.labelTexture.xslices 			= img.texture.xslices;

        // Flipping Y coordinates to match the world's orientation
        this.labelTexture.flipY 			= true;
        this.labelTexture.needsUpdate 		= true;
    } else {
        this.labelTexture = null;
    }
    if(this.meshSecondPass !== null && this.labelTexture !== null)
        this.meshSecondPass.material.uniforms.labelTex.value = this.labelTexture;
};


CoseGUI.prototype.clearLabelMeshes = function(selectedLabels) {

    var i;

    // Clearing all meshes if something other than an Array (typed as "object") is passed
    if(selectedLabels === undefined || selectedLabels === null || typeof selectedLabels !== "object") {

        for (i = 0; i < this.meshLabels.length; i++) {
            this.getScene().remove(this.meshLabels[i]);
            this.meshLabels[i].geometry.dispose();
            this.meshLabels[i].material.dispose();
        }

        // for (i = this.meshLabels.length; i > 0; i--) {
        //     this.meshLabels.pop();
        // }

        this.meshLabels = [];

    } else if (selectedLabels.length > 0){
        var remainingMeshes = [];

        // Disposing material of selected labels
        for (i = 0; i < this.meshLabels.length; i++) {
            var idx = selectedLabels.indexOf(this.meshLabels[i].label);
            if(idx >= 0) {
                this.getScene().remove(this.meshLabels[i]);
                this.meshLabels[i].geometry.dispose();
                this.meshLabels[i].material.dispose();
            } else {
                remainingMeshes.push(this.meshLabels[i]);
            }
        }

        // Updating the label meshes with the ones that have not been removed
        this.meshLabels = remainingMeshes;
    }

    this.adjacentLabels = [];
};

CoseGUI.prototype.createLabelMeshes = function(labelGeometries, lambert_or_phong) {

    for (var i = 0; i < labelGeometries.length; i++) {
        var material;

        if(lambert_or_phong) {
            material = new THREE.MeshLambertMaterial({
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1.0,
                clippingPlanes: null,
                clipShadows: true,
                wireframe: guiParams.labelWireframe,
                shading: THREE.SmoothShading
            });
        } else {
            material = new THREE.MeshPhongMaterial({
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1.0,
                clippingPlanes: null,
                clipShadows: true,
                wireframe: guiParams.labelWireframe,
                shading: THREE.SmoothShading,
                shininess: 0.1
            });
        }

        this.meshLabels.push(new THREE.Mesh(labelGeometries[i], material));

        // Adding a label field to the mesh to facilitate posterior coloring
        this.meshLabels[this.meshLabels.length - 1].label = labelGeometries[i].label;
        // Adding a forceVisibility field to facilitate the continuous display of an image even when it does not meet
        // certain criteria
        this.meshLabels[this.meshLabels.length - 1].forceVisibility = VISIBILITY_CUSTOM;

        this.getScene().add(this.meshLabels[this.meshLabels.length - 1]);

    }
};

CoseGUI.prototype.updateSelectedLabelCenterWorld = function(selLabel) {
    var selLabelCenterWorld = null;

    if(selLabel > 0) {
        for (var i = 0; i < this.meshLabels.length; i++) {
            // Setting the center of the world as the geometric center of the selected label
            if (this.meshLabels[i].label === selLabel) {
                // Obtaining the center of the selected label in world coordinates
                selLabelCenterWorld = this.meshLabels[i].geometry.geom_center_world.clone();
            }
        }
    }

    return selLabelCenterWorld;
};

CoseGUI.prototype.selectLabelsForDisplay = function (selLabels, set_camera_focus) {
    guiParams.setSelectedLabels(selLabels);
//		guiParams.fixateClippingPlane = (parseInt(selLabels) !== DISPLAY_ALL_LABEL_MESHES && parseInt(selLabels) !== DISPLAY_NO_LABEL_MESH);
    guiParams.fixateClippingPlane = true;

    if(set_camera_focus)
        this.setCameraFocus(true);
};


CoseGUI.prototype.updateLabelMeshes = function() {
    function updateLabelMesh(labelMesh, clippingPlane, clippingPlaneDir, visible, color) {

        updateMeshClippingPlane(labelMesh, visible, clippingPlane, clippingPlaneDir);

        // Setting the remaining label mesh parameters
        labelMesh.material.wireframe 	= guiParams.labelWireframe;
        labelMesh.material.opacity 		= 1.0;
        labelMesh.material.color.set(color);
    }

    for (var i = 0; i < this.meshLabels.length; i++) {
        var color;
        var lb = this.meshLabels[i].label;
        var lb_idx = guiParams.selLabels.indexOf(this.meshLabels[i].label);

        if (guiParams.neighborsSameColor) {
            var lb_display = 0;

            if (lb_idx >= 0)
                lb_display = 1;

            color = colorMapBin.getColor(lb_display);
        } else {
            color = colorMap1024.getColor(lb);
        }

        var is_adjacent =  false;

        if(this.adjacentLabels.length > 0) {
            for (var j = 0; j < guiParams.selLabels.length && !is_adjacent; j++) {
                is_adjacent = (guiParams.selLabels[j] >= 0 && guiParams.selLabels[j] < this.adjacentLabels.length
                && findLabelIndex(this.adjacentLabels[guiParams.selLabels[j]], lb) >= 0);
            }
        }

        var visible;

        if(this.meshLabels[i].label === BORDER_LABEL_ID) {
            visible = guiParams.show3DRendition && parseInt(guiParams.overlay) === BORDER_MESH_OVERLAY && guiParams.selLabels[0] !== DISPLAY_NO_LABEL_MESH;
        } else if(this.meshLabels[i].forceVisibility !== VISIBILITY_NEVER) {
            visible = parseInt(guiParams.overlay) === LABEL_MESH_OVERLAY && (lb_idx >= 0 || (guiParams.showAdjacentLabels && is_adjacent)
                || guiParams.selLabels[0] === DISPLAY_ALL_LABEL_MESHES || this.meshLabels[i].forceVisibility === VISIBILITY_ALWAYS) && guiParams.show3DRendition;
        } else {
            visible = false;
        }

        updateLabelMesh(this.meshLabels[i], this.clippingPlane, this.clippingPlaneDir, visible, color);
    }
    //console.log(this.meshLabels);

};


CoseGUI.prototype.updateAxes = function () {
    // Forcing the text to face towards the camera's direction
    this.axes.xtext.lookAt(this.camera.getWorldDirection().clone().negate());
    this.axes.ytext.lookAt(this.camera.getWorldDirection().clone().negate());
    this.axes.ztext.lookAt(this.camera.getWorldDirection().clone().negate());
    // Forcing the plane mesh to face the clipping plane's direction
    this.axes.plane.lookAt(this.clippingPlane.normal);
    // Doing the same as above for the plane's normal arrow
    this.axes.plane_arrow.setDirection(this.clippingPlane.normal.clone());

    // Rotating the entire axis object to match the camera's direction, thereby making the whole object stationary
    // w.r.t. the camera's position
    this.axes.position.copy(this.camera.position);
    this.axes.rotation.copy(this.camera.rotation);
    this.axes.updateMatrix();
    this.axes.translateZ(-1);
    this.axes.translateX(-1.5);
    // Aligning the axis back with the coordinate system
    this.axes.rotation.copy(new THREE.Euler(0, 0, 0, 'XYZ'));
    this.axes.updateMatrix();
};

CoseGUI.prototype.flipPlane = function() {
    if(guiParams.curModel !== null) {
        // Negating the plane's normal and the distance parameter
        this.clippingPlane.normal.negate();
        guiParams.planeDist *= -1;

        // Updating the clipping plane since the plane distance changed
        var boxDiagSize = currentImage.getBoxDiagonalSize();

        this.updateClippingPlane(boxDiagSize);
    }
};

CoseGUI.prototype.updateClippingPlane = function(boxDiagSize) {

    var v;

    if (!guiParams.fixateClippingPlane) {
        v = new THREE.Vector3();

        this.camera.getWorldDirection(v);

        v.normalize();

        this.clippingPlane.normal = v.clone().negate();
    }

    var constant_wrt_origin = (guiParams.planeDist / 2.0 )* boxDiagSize;

    v = this.clippingPlane.normal.clone();

    // Computing the distance between the plane relative to the current camera focus, which might be different than
    // the origin, and the plane with the same normal relative to the origin
    var plane_at_origin 				= new THREE.Plane(new THREE.Vector3(v.x, v.y, v.z), 0.0);
    var point_on_plane_at_camera_focus 	= v;

    // Finding a point on the plane to compute the distance between planes
    point_on_plane_at_camera_focus.multiplyScalar(constant_wrt_origin);
    // Placing the point with coordinates relative to the origin of the "label plane"
    point_on_plane_at_camera_focus.sub(this.cameraFocus);

    // Computing the distance between planes
    var d =  plane_at_origin.distanceToPoint(point_on_plane_at_camera_focus);
    if (+d > -0.49 && +d < 0.49){
        positiveD = d + .49;
        adjD = positiveD * .6;
        denD = .49*2 * .6;
        //globalD = d;
        //console.log(d);
        this.clippingPlane = new THREE.Plane(this.clippingPlane.normal.clone(), d);

        if ((mxPos >= 0 && mxPos <= 250) && (myPos >= 0 && myPos <= 250)){
            var sliceD =  Math.floor(adjD/denD * 250);
            var sliceMini =  Math.floor(adjD/denD * 100);
            //console.log(sliceD, sliceMini)
            changeXZPlane(mxPos, myPos, sliceD, sliceMini);
        }
    }
};


CoseGUI.prototype.updateForRendering = function(img_data) {
    if(this.sceneSecondPass !== null) {
        var __ret = this.getOverlayTextures(img_data);
        var overlay = __ret.overlay;

        this.updateLabelMeshes();

        this.clearPlaneMesh();
        this.createPlaneMesh();

        if(this.meshSecondPass !== null) {
            this.meshSecondPass.material.uniforms.steps.value = guiParams.steps;
            this.meshSecondPass.material.uniforms.alphaCorrection.value = guiParams.alphaCorrection;
            this.meshSecondPass.material.uniforms.alphaLabelCorrection.value = guiParams.alphaLabelCorrection;
            this.meshSecondPass.material.uniforms.gammaCorrection.value = guiParams.gammaCorrection;
            this.meshSecondPass.material.uniforms.borderThresh.value = guiParams.borderThresh;
            this.meshSecondPass.material.uniforms.overlay.value = overlay;
            this.meshSecondPass.material.uniforms.clippingPlane.value = planeToVec4(this.clippingPlane);
            this.meshSecondPass.material.uniforms.useLogTransfFunction.value = guiParams.useLogTransfFunction ? 1 : 0;
            this.meshSecondPass.material.uniforms.k_logFun.value = guiParams.k_logFun;
            this.meshSecondPass.material.uniforms.x0_logFun.value = guiParams.x0_logFun;
            this.meshSecondPass.material.uniforms.borderColor.value = hexToRgb(guiParams.borderColor);
            this.meshSecondPass.material.uniforms.overlayAlpha.value = guiParams.overlayAlpha;
            this.meshSecondPass.material.uniforms.intensity_as_alpha.value = (guiParams.intensity_as_alpha) ? 1.0 : 0.0;
        }

        this.updateAxes();

        // Updating the direction of the light source stemming from the camera direction according to the new
        // camera position
        var cameraDir = this.camera.getWorldDirection();
        this.lightCamera.position.set(cameraDir.x, cameraDir.y, cameraDir.z);
        this.lightCamera.target.position.set(0, 0, 0);
    }
};

/*document.getElementById("container").addEventListener('mousemove', function(evt) {
        var mousePos = getMousePos(evt);
        if ((mousePos.x >= 0 && mousePos.x <= 250) && (mousePos.y >= 0 && mousePos.y <= 250)){
            var sliceD =  Math.floor((+globalD + .866)/(2*.866) * 250);
            var sliceMini =  Math.floor((+globalD + .866)/(2*.866) * 100);
            changeXZPlane(mousePos.x, mousePos.y, sliceD, sliceMini);
        }
      }, false);*/

function getMousePos(evt) {
    var rect = document.getElementById("container").getBoundingClientRect();
    return {
        x: evt.clientX-rect.left - 110,
        y: evt.clientY-rect.top - 135
    };
  }

function changeXZPlane(xPos, yPos, sliceD, sliceMini){
    var xzurl = "";
    var ySlice = Math.floor(yPos/250*60);
      
      if (ySlice < 10) { 
        xzurl = 'slices/xz_000' + ySlice + '.jpg';}
      else { 
        xzurl = 'slices/xz_00' + ySlice + '.jpg';}
    
    xzsq = new Image();

    xzsq.src =  xzurl;

    context.drawImage(xzsq, x2, 125, 250, 250);

    /*drawnScribblesY[ySlice].scribbles.forEach(function(d){
        context.beginPath();
        context.arc(d.x + 350, d.y, 5, 0, 2 * Math.PI, false);
        context.fillStyle = 'yellow';
        context.fill();
     })*/
    //console.log(globalD);

    context.fillStyle = '#21A9CC';
    context.fillRect(xPos + x2, 125, 1, 250); //vertical crosshair
    context.fillStyle = '#F2B333';
    context.fillRect(x2, sliceD + 125, 250, 1); //horizontal crosshair

    drawCube(120, 225, 80, 100, 100, sliceMini, xPos/250, yPos/250);
}


function drawCube(x, y, wx, wy, h, slice, xCh, yCh) {
    mapctx.clearRect(0, 0, 230, 300);

    mapctx.fillStyle = "#F2B333";
    mapctx.beginPath();
    mapctx.moveTo(x, y - 100 + slice);
    mapctx.lineTo(x - wx, y - h - wx * 0.5 + slice);
    mapctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5) + slice);
    mapctx.lineTo(x + wy, y - h - wy * 0.5 + slice);
    mapctx.closePath();
    mapctx.fill();
    mapctx.stroke();

    var y0 = 65;
    for (i=0; i<60; i++){
        mapctx.beginPath();
        mapctx.moveTo(221, i/6*10 + y0);
        mapctx.lineTo(221 + allScribbles[i].scribbles.length * 5/3, i/6*10 + y0)
        mapctx.lineTo(221 + allScribbles[i].scribbles.length * 5/3, i/6*10 + (y0+5/3))
        mapctx.lineTo(221, i/6*10 + (y0+5/3))
        mapctx.closePath();
        mapctx.fill();
    }

    var lengthx = Math.hypot(wy, wy * 0.5) * xCh;
    mapctx.translate(lengthx*Math.sin(Math.PI/3) + (xCh * 2), -lengthx*Math.cos(Math.PI/3) + (xCh * 5));
    mapctx.strokeStyle = "#21A9CC";
    mapctx.beginPath();
    mapctx.moveTo(x, y - 100 + slice);
    mapctx.lineTo(x - wx, y - h - wx * 0.5 + slice);
    mapctx.closePath();
    mapctx.stroke();
    mapctx.translate(-lengthx*Math.sin(Math.PI/3) - (xCh * 2), lengthx*Math.cos(Math.PI/3) - (xCh * 5));

    var lengthy = Math.hypot(wx, -100 + h + wx * 0.5) * yCh;
    mapctx.strokeStyle = "#FF0058";
    mapctx.translate(lengthy*Math.sin(Math.PI/3) + (yCh * 5), +lengthy*Math.cos(Math.PI/3) - (yCh * 2));
    mapctx.beginPath();
    mapctx.moveTo(x - wx, y - h - wx * 0.5 + slice);
    mapctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5) + slice);
    mapctx.closePath();
    mapctx.stroke();
    mapctx.translate(- lengthy*Math.sin(Math.PI/3) - (yCh * 5), -lengthy*Math.cos(Math.PI/3) + (yCh * 2));


    mapctx.strokeStyle = "white";
    mapctx.beginPath();
    mapctx.moveTo(x, y);
    mapctx.lineTo(x - wx, y - wx * 0.5);
    mapctx.lineTo(x - wx, y - h - wx * 0.5);
    mapctx.lineTo(x, y - h * 1);
    mapctx.closePath();
    mapctx.stroke();

    mapctx.beginPath();
    mapctx.moveTo(x, y);
    mapctx.lineTo(x + wy, y - wy * 0.5);
    mapctx.lineTo(x + wy, y - h - wy * 0.5);
    mapctx.lineTo(x, y - h * 1);
    mapctx.closePath();
    mapctx.stroke();

    mapctx.beginPath();
    mapctx.moveTo(x, y - h);
    mapctx.lineTo(x - wx, y - h - wx * 0.5);
    mapctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5));
    mapctx.lineTo(x + wy, y - h - wy * 0.5);
    mapctx.closePath();
    mapctx.stroke();
 }
