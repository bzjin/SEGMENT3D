<b>Segment3d</b>

<b>PROGRAMMING START GUIDE</b>

<b>REPOSITORIES</b>

Old interface (by Thiago Spina): https://github.com/bzjin/3D-Cell-Wall-Segmentation/commit/572e6d10a6ffd26b190089579fbf5a8ae219e4d0

Current interface (by Beatrice Jin) : https://github.com/bzjin/3D-Cell-Wall-Segmentation

Both interfaces run on standard web servers and local servers such as MAMP. Both are disconnected from the databases but contain local data files. The middle view port uses ray casting of raw files found in the folder data, and the right view port uses image sequences of jpegs (manually cut with the software ImageJ) in the folder slices.

<b>SCRIPT DOCUMENTATION</b>

Much of the 3D rendering that appears in the center viewport was built by Thiago Spina. The overarching framework that he built was used so that the new code could be plugged back into the database with relative ease. The following will detail the major changes that were made to the original interface, file by file:

<b>CSS</b>

static/common/base.css

Instructions, background, text, color, and composition changes 

static/crowd/tileui/css/cosegui.css

Button,  sizing, and composition changes

<b>JAVASCRIPT</b>

static/crowd/workers/script/js/Interface2D.js

I wrote this file from scratch. It sets up all of the canvases that are displayed. Function initf() sets up the Three scene for the fashion show down below.  The event listener mousemove sets the global variables for mouse position, which is used in CoseGUI.js. The event listener click sends all of the meshes in the array meshLabels to the Three scene. Functions openNav() and closeNav() open and close the instructions panel. 

static/crowd/workers/script/js/CoseGUI.js

Thiago wrote most of this file. I updated the latter half, especially the function CoseGUI.prototype.updateClippingPlane(), which constantly updates the middle yellow viewport where 3D segmentation takes place. At the bottom of the function, the variable d is used to measure the z position of the scribble that is placed. It is then translated to sliceD and sliceMini in order to define the images and planes shown on the right view port and the left mini-map, respectively. This change is implemented by the function changeXZPlane, which takes, besides the two aforementioned variables, the mouse position defined in Interface.js. 

The function changeXZPlane  then calls drawCube, which simply redraws the entire mini-map based on the mouse position and z-plane. The for-loop inside updates the progress bar on the left side of the mini-map.
 
static/crowd/workers/script/js/Drawing.js

The function createScribbleGeometry defines the x, y, and z position of each scribble. It also updates the array meshArrayToDraw, which is the basis for the progress bar from drawCube. 

static/crowd/workers/script/js/ScribbleManager.js

The function ScribbleManager.prototype.clearScribbleCollection clears all of the interfaces (not just the middle view-port) and redraws blank canvases.

<b>FUTURE WORK</b>

This interface currently stands alone with only local files. The old interface was connected to a database that allowed the lab to load in new data and save the image segmentations. 

There is a lot of information stored in the CoseGUI.meshLabels array. This should be taken advantage of, for instance, by calculating the volume, convexity, and shape of each cell segmentation. This may reduce the visual labor that users must perform while checking the 3D fashion show view port. 

It is possible that one more plane of data needs to be checked – the yz plane. The current two 2D viewports are pretty accurate, but there is no guarantee without seeing all three sides of the data. It might be helpful to add a toggle (perhaps with a spacebar?) that switches the rightmost view port between XZ and YZ planes. 

In terms of a user experience, it may be advantageous to add a final sense of completion, which allows the user to see the entirety of the 3D cell that they are forming per segmentation. This may motivate users more than seeing only disparate parts of the work that they are doing. 


<b>APPENDIX</b>

Final presentation slides (August 15, 2017): https://docs.google.com/presentation/d/1pEHxXuN8JIGcDKiH18I-y9EQzKLm2oQjt7yHCEDPE38/edit?usp=sharing

Previous iterations and demos:
https://github.com/bzjin/2D-3D-D3-Cells
https://github.com/bzjin/Nodes-and-Edges
