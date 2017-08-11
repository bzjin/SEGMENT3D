colorx = "white";
colory = "#58BCA0";
colorz = "#D2AA3B";
//colorbg = ;

window.onload = function() {
	allScribbles = [];

	for (i=0; i<60; i++){
		allScribbles.push({"slice": i, "scribbles": []})
	}

	/* view along the y axis (second view) */
	var canvas = d3.select("#grid2d").append("canvas")
		.attr("id", "grid2d")
		.attr("width",  400)
		.attr("height", 400);

	/* view along the z axis (first view) */
	var canvas2 = d3.select("#container2").append("canvas")
		.attr("id", "keycanvas")
		.attr("width",  500)
		.attr("height", 500);

	/* Mini-map view */	
	var minimap = d3.select("#minimap").append("canvas")
			.attr("id", "minimapc")
			.attr("width",  300)
			.attr("height", 300);


	/* Fashion show  */
	var scenef, cameraf, rendererf;

	function initf() {
		scenef = new THREE.Scene();
		scenef.background = new THREE.Color( 0x19203C );

		cameraf = new THREE.PerspectiveCamera( 45, 1500/260, .1, 1000 );
		lightf = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1);

		cameraf.lookAt(scenef.position);
		cameraf.position.z = 8; 
		//cameraf.position.set( 0, - 450, 400 );
		//cameraf.rotation.x = 45 * ( Math.PI / 180 );
		scenef.add( cameraf );
		scenef.add( lightf );

		rendererf = new THREE.WebGLRenderer();
		rendererf.setSize(1500, 260);
		document.getElementById("fashionshow").appendChild( rendererf.domElement );

		animatef = function () {
			requestAnimationFrame( animatef );
			if (typeof meshArrayToDraw != 'undefined') {
				for (j = 0; j < meshArrayToDraw.length; j++) {
	        		//meshArrayToDraw[j].rotation.x += .001;
	        		//meshArrayToDraw[j].rotation.y += .001;
	        	}
	        	//console.log(meshArrayToDraw[i]);
	        }
			rendererf.render(scenef, cameraf);
		};

		animatef();
	}

	initf();

	

	/* Create all canvas contexts */
	context = canvas.node().getContext("2d");
	context2 = canvas2.node().getContext("2d");

    mapctx = minimap.node().getContext("2d");
    mapctx.strokeStyle = "white";

	
	// Set up FIRST view of z axis
	context2.font = "10px Effra";
	context2.fillStyle = "white"
	context2.beginPath();
	context2.lineWidth="5";
	context2.strokeStyle = colorz;
	context2.strokeRect(97, 122, 256, 256);

	/*
	context2.lineWidth="50";
	context2.strokeStyle = 'rgba(255, 255, 255, .3)';
	context2.strokeRect(125, 150, 200, 200);*/

	context2.lineWidth="1";
	context2.strokeStyle = 'white';

	// Set up SECOND view of y axis
	x2 = 25;
	context.fillStyle =("white");

	context.beginPath();
	context.lineWidth="5";
	context.fillStyle = 'black';
	context.strokeStyle = colory;
	context.fillRect(x2, 125, 250, 250);
    context.strokeRect(x2-3, 122, 256, 256);
	context.lineWidth="1";
	context.strokeStyle = 'white';

	mxPos = 0;
    myPos = 0;
	//console.log(CoseGUI.meshLabels)

	document.getElementById("container").addEventListener('mousemove', function(evt) {
        var mousePos = getMousePos(evt);
        mxPos = mousePos.x;
        myPos = mousePos.y;
        if ((mousePos.x >= 0 && mousePos.x <= 250) && (mousePos.y >= 0 && mousePos.y <= 250)){
        	/*var sliceD =  Math.floor(adjD/denD * 250);
 	 		var sliceMini =  Math.floor(adjD/denD * 100);
        	changeXZPlane(mousePos.x, mousePos.y, sliceD, sliceMini);*/
        }
      }, false);

	document.getElementById("container").addEventListener('click', function(evt) {
        var mousePos = getMousePos(evt);
        mxPos = mousePos.x;
        myPos = mousePos.y;

        if ((mousePos.x >= 0 && mousePos.x <= 250) && (mousePos.y >= 0 && mousePos.y <= 250)){
        	while(scenef.children.length > 0){ 
			    scenef.remove(scenef.children[0]); 
			}

			lightf = new THREE.HemisphereLight( 0xffffbb, 0x080820, 10);
			scenef.add( lightf );

        	for (i = 0; i < meshArrayToDraw.length; i++) {
        		meshArrayToDraw[i].forceVisibility = BORDER_MESH_OVERLAY;
        		meshArrayToDraw[i].visible = true;
        		meshArrayToDraw[i].material.color.setHex( 0x044138);
        		meshArrayToDraw[i].material.shininess = 30;

        		if (i < 8 ) {
        			meshArrayToDraw[i].position.x = (i - 4) * 2;
        			meshArrayToDraw[i].position.y = 1.5;
        		} else if (i >= 8 && i < 16 ) {
        			meshArrayToDraw[i].position.x = (i/2 - 4) * 2;
        		} else {
        			meshArrayToDraw[i].position.x = (i/3 - 4) * 2;
        			meshArrayToDraw[i].position.y = -1.5;        		
        		}

        		console.log(meshArrayToDraw[i].position);
        		scenef.add(meshArrayToDraw[i]);
        	}
        	animatef();
        }
      }, false);
/*
	document.getElementById("container").addEventListener('scroll', function(evt) {
		 var screenheight = parseInt($(document).height());
         var scrolledpx = parseInt($("div#container").scrollTop());     
         var sum = screenheight+scrolledpx;
         console.log($("div#container").scrollTop());
         console.log("screen: " + screenheight);
         console.log("sum=" + sum);
	}, false);*/

	function getMousePos(evt) {
        var rect = document.getElementById("container").getBoundingClientRect();
        return {
        	x: evt.clientX-rect.left - 110,
			y: evt.clientY-rect.top - 135
        };
      }

    /* changes planes on the right and calls update mini-map */
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

 	 	//SECOND BOX CROSSHAIR

		context.fillStyle = colorz;
		context.fillRect(x2, sliceD + 125, 250, 1); //horizontal crosshair

		context.fillStyle = colorx;
		context.beginPath();
        context.arc(xPos + x2, sliceD + 125, 5, 2 * Math.PI, false); //travelling dot
        context.fill(); 

		//FIRST BOX CROSSHAIR
		context2.clearRect(100, 125, 250, 250);
		/*context2.lineWidth="50";
		context2.strokeStyle = 'rgba(255, 255, 255, .3)';
		context2.strokeRect(125, 150, 200, 200);*/
/*
		context2.lineWidth="1";
		context2.fillStyle = '#21A9CC';
		context2.fillRect(xPos + x2 + 75, 125, 1, 250); //vertical crosshair
		context2.fillStyle = colory;
		context2.fillRect(x2 + 75, yPos + 125, 250, 1); //horizontal crosshair
		*/
		context.lineWidth="5";
	    context.strokeStyle = colory;
	    context.strokeRect(x2-3, 122, 256, 256);

		drawCube(120, 225, 80, 100, 100, sliceMini, xPos/250, yPos/250);
    } 

    /* draws mini-map on the left */
	function drawCube(x, y, wx, wy, h, slice, xCh, yCh) {
		mapctx.clearRect(0, 0, 230, 300);

	    mapctx.fillStyle = colorz;
	    mapctx.beginPath();
	    mapctx.moveTo(x, y - 100 + slice);
	    mapctx.lineTo(x - wx, y - h - wx * 0.5 + slice);
	    mapctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5) + slice);
	    mapctx.lineTo(x + wy, y - h - wy * 0.5 + slice);
	    mapctx.closePath();
	    mapctx.fill();
	    mapctx.stroke();

	    var y0 = 75;
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
	    mapctx.strokeStyle = colorx;
	    mapctx.beginPath();
	    mapctx.moveTo(x, y - 100 + slice);
	   	mapctx.lineTo(x - wx, y - h - wx * 0.5 + slice);
		mapctx.closePath();
	    mapctx.stroke();
        mapctx.translate(-lengthx*Math.sin(Math.PI/3) - (xCh * 2), lengthx*Math.cos(Math.PI/3) - (xCh * 5));

 		mapctx.translate(lengthx*Math.sin(Math.PI/3) + (xCh * 2), -lengthx*Math.cos(Math.PI/3) + (xCh * 5));
	    mapctx.strokeStyle = colorx;
	    mapctx.beginPath();
	    mapctx.moveTo(x, y - 100);
	   	mapctx.lineTo(x - wx, y - h - wx * 0.5);
		mapctx.closePath();
	    mapctx.stroke();
        mapctx.translate(-lengthx*Math.sin(Math.PI/3) - (xCh * 2), lengthx*Math.cos(Math.PI/3) - (xCh * 5));

        mapctx.translate(lengthx*Math.sin(Math.PI/3) + (xCh * 2), -lengthx*Math.cos(Math.PI/3) + (xCh * 5));
	    mapctx.strokeStyle = colorx;
	    mapctx.beginPath();
	    mapctx.moveTo(x, y);
	   	mapctx.lineTo(x - wx, y - h - wx * 0.5 + 100);
		mapctx.closePath();
	    mapctx.stroke();
        mapctx.translate(-lengthx*Math.sin(Math.PI/3) - (xCh * 2), lengthx*Math.cos(Math.PI/3) - (xCh * 5));

        var lengthy = Math.hypot(wx, -100 + h + wx * 0.5) * yCh;
        mapctx.strokeStyle = colory;
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
	
	
	//console.log(meshArray);

	 return null;

}

function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}