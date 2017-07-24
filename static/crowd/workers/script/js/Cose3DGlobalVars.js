"use strict";


/*****************************************************************************************************************/
/*													Global Constants 											 */
/*****************************************************************************************************************/

const MAXIMUM_3D_TEXTURE_SIZE   = 64;

const DISPLAY_NO_LABEL_MESH	 	= -1;
const DISPLAY_ALL_LABEL_MESHES 	= -2;
const DISPLAY_CUSTOM_LABEL_MESH	= -3;

const NO_OVERLAY			= 0;
const LABEL_OVERLAY			= 1;
const BORDER_OVERLAY		= 2;
const BORDER_LABEL_OVERLAY	= 3;
const LABEL_MESH_OVERLAY	= 4;
const BORDER_MESH_OVERLAY	= 5;

const XY_PLANE				= 0;
const XZ_PLANE				= 1;
const YZ_PLANE				= 2;

const MAX_NUM_OBJECTS		= 256; // Maximum number of labels that can be colored

const CLIPPING_PLANE_DIR_POS 	= 1.0;
const CLIPPING_PLANE_DIR_NEG 	= -1.0;
const CLIPPING_PLANE_DIR_BOTH 	= 0.0;

const VISIBILITY_ALWAYS			= 0;
const VISIBILITY_NEVER			= 1;
const VISIBILITY_CUSTOM			= 2;

// Maximum number of allowed objects
const BORDER_LABEL_ID			= 0; // Using label 0 to represent the 3D border rendition

const CONTEXT_BORDER_ALPHA      = 0.2;

/*****************************************************************************************************************/
/*													Global Variables							  	 	 		 */
/*****************************************************************************************************************/

var renderer;

var availableImages			= {};
var imgInfo					= null;
var currentImageIdx         = -1;
var currentImage			= null;

var guiParams				= null;
var advancedGUIControls		= null;
var coseGUI					= null;
var font 					= null;

var scribbleManager 		= null;
var delineationAlg			= null;

var custom_meshphong_frag 			= document.getElementById('customPhongFragmentShader').textContent;
var custom_meshlambert_frag 		= document.getElementById('customLambertFragmentShader').textContent;
var default_meshphong_frag			= THREE.ShaderChunk.meshphong_frag;
var default_meshlambert_frag		= THREE.ShaderChunk.meshlambert_frag;

var optimize_for_mobile             = false;
var show_advanced_GUI_controls      = true;

// Colormaps used to paint labels/scribbles
const colorMap1024 = new ColorMap1024();
const colorMapScribblesBin = new ColorMapScribblesBin();
const colorMapBin = new ColorMapBin();

// Variables to count user interaction
var numInteractions         = 0;
